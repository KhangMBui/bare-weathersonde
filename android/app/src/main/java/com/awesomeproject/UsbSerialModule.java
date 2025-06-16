package com.awesomeproject;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.*;
import android.util.Log;
import android.os.Build;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.hoho.android.usbserial.driver.*;
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Executors;

public class UsbSerialModule extends ReactContextBaseJavaModule {

  private static final String TAG = "UsbSerialModule";
  private static final String ACTION_USB_PERMISSION = "com.awesomeproject.USB_PERMISSION";

  private SerialInputOutputManager usbIoManager;
  private UsbSerialPort serialPort;
  private UsbManager usbManager;
  private Promise permissionPromise;

  public UsbSerialModule(ReactApplicationContext reactContext) {
    super(reactContext);
    usbManager = (UsbManager) reactContext.getSystemService(Context.USB_SERVICE);

    // Register USB permission broadcast receiver
    IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
    // reactContext.registerReceiver(usbReceiver, filter, RECEIVER_EXPORTED);
    // reactContext.registerReceiver(usbReceiver, filter, RECEIVER_NOT_EXPORTED);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactContext.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    } else {
      reactContext.registerReceiver(usbReceiver, filter);
    }
  }

  @Override
  public String getName() {
    return "UsbSerial";
  }

  @ReactMethod
  public void openPort(int vendorId, int productId, Promise promise) {
    this.permissionPromise = promise;

    List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
    for (UsbSerialDriver driver : drivers) {
      UsbDevice device = driver.getDevice();
      if (device.getVendorId() == vendorId && device.getProductId() == productId) {
        if (!usbManager.hasPermission(device)) {
          // Request permission
          PendingIntent pi = PendingIntent.getBroadcast(getReactApplicationContext(), 0,
              new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE);
          usbManager.requestPermission(device, pi);
          // Will continue in usbReceiver
          return;
        } else {
          // Permission already granted
          openDevice(driver, promise);
          return;
        }
      }
    }
    promise.reject("NOT_FOUND", "Device with VID " + vendorId + " PID " + productId + " not found.");
  }

  @ReactMethod
  public void setPortParameters(int baudRate, int dataBits, int stopBits, int parity, Promise promise) {
    if (serialPort == null) {
      promise.reject("NO_PORT", "Serial port is not open.");
      return;
    }
    try {
      serialPort.setParameters(baudRate, dataBits, stopBits, parity);
      promise.resolve(null);
    } catch (IOException e) {
      promise.reject("SET_PARAMS_FAILED", e.getMessage());
    }
  }

  private void openDevice(UsbSerialDriver driver, Promise promise) {
    UsbDeviceConnection connection = usbManager.openDevice(driver.getDevice());
    if (connection == null) {
      promise.reject("OPEN_FAILED", "Could not open device connection");
      return;
    }
    serialPort = driver.getPorts().get(0);
    try {
      serialPort.open(connection);
      serialPort.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
    } catch (IOException e) {
      promise.reject("OPEN_FAILED", e.getMessage());
      return;
    }

    usbIoManager = new SerialInputOutputManager(serialPort, listener);
    // Executors.newSingleThreadExecutor().execute(usbIoManager);
    usbIoManager.start();

    promise.resolve(null);
  }

  @ReactMethod
  public void closePort() {
    if (usbIoManager != null) {
      usbIoManager.stop();
      usbIoManager = null;
    }
    if (serialPort != null) {
      try {
        serialPort.close();
      } catch (IOException e) {
        Log.e(TAG, "Error closing serial port", e);
      }
      serialPort = null;
    }
  }

  private final SerialInputOutputManager.Listener listener = new SerialInputOutputManager.Listener() {
    @Override
    public void onNewData(byte[] data) {
      String dataStr = new String(data);
      getReactApplicationContext()
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("UsbSerialData", dataStr);
    }

    @Override
    public void onRunError(Exception e) {
      Log.e(TAG, "Runner stopped due to error: ", e);
    }
  };

  private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
        synchronized (this) {
          UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
          if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
            if (device != null) {
              List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
              for (UsbSerialDriver driver : drivers) {
                if (driver.getDevice().equals(device)) {
                  openDevice(driver, permissionPromise);
                  return;
                }
              }
            }
          } else {
            permissionPromise.reject("PERMISSION_DENIED", "User denied USB permission.");
          }
        }
      }
    }
  };
}
