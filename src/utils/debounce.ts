interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  leading = false,
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!leading) func(...args);
    };

    const callNow = leading && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  } as DebouncedFunction<T>;

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
