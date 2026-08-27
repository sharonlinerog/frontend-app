// Reglas de validación del formulario, en el mismo espíritu que las reglas
// del DTO en el backend (CreditoCreateDto.cs). Se repiten a propósito:
// esta es la validación "de primera línea" que le da feedback inmediato
// al usuario, pero el backend SIEMPRE vuelve a validar todo por su cuenta.
export function validarCredito(valores) {
  const errores = {};

  if (!valores.nombreCliente || valores.nombreCliente.trim().length < 3) {
    errores.nombreCliente = "El nombre del cliente debe tener al menos 3 caracteres";
  }

  if (!valores.cedula || !/^[A-Za-z0-9-]{5,30}$/.test(valores.cedula.trim())) {
    errores.cedula = "La cédula/ID debe tener entre 5 y 30 caracteres (solo letras, números y guiones)";
  }

  const valorCredito = Number(valores.valorCredito);
  if (!valores.valorCredito || Number.isNaN(valorCredito) || valorCredito <= 0) {
    errores.valorCredito = "El valor del crédito debe ser un número mayor a 0";
  }

  const tasaInteres = Number(valores.tasaInteres);
  if (valores.tasaInteres === "" || Number.isNaN(tasaInteres) || tasaInteres < 0 || tasaInteres > 100) {
    errores.tasaInteres = "La tasa de interés debe estar entre 0 y 100";
  }

  const plazoMeses = Number(valores.plazoMeses);
  if (!Number.isInteger(plazoMeses) || plazoMeses <= 0) {
    errores.plazoMeses = "El plazo en meses debe ser un número entero mayor a 0";
  }

  if (!valores.comercial || valores.comercial.trim().length < 3) {
    errores.comercial = "El nombre del comercial debe tener al menos 3 caracteres";
  }

  return errores;
}
