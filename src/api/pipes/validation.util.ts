import { ValidationError } from 'class-validator';

export function formatValidationErrors(errors: ValidationError[]): {
  campo: string;
  detalle: string;
}[] {
  const formatError = (error: ValidationError, parentPath = ''): { campo: string; detalle: string }[] => {
    const property = error.property;
    let path = parentPath;
    if (parentPath) {
      path = /^\d+$/.test(property) ? `${parentPath}[${property}]` : `${parentPath}.${property}`;
    } else {
      path = property;
    }

    const list: { campo: string; detalle: string }[] = [];
    if (error.constraints) {
      Object.values(error.constraints).forEach((detail) => {
        list.push({ campo: path, detalle: detail });
      });
    }

    if (error.children?.length) {
      error.children.forEach((child) => {
        list.push(...formatError(child, path));
      });
    }

    return list;
  };

  return errors.flatMap((err) => formatError(err));
}
