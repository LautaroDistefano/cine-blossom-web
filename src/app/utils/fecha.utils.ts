// Calcula la edad actual de una persona a partir de su fecha de nacimiento.
// Usada para validar restricciones de edad al comprar entradas (RF19).
export function calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const mesActual = hoy.getMonth() - nacimiento.getMonth();
    const yaCumplioEsteAnio = mesActual > 0 || (mesActual === 0 && hoy.getDate() >= nacimiento.getDate());

    if (!yaCumplioEsteAnio) {
        edad--;
    }

    return edad;
}