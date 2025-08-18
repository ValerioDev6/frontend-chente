// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Lógica de autenticación (por ejemplo, leer cookie HTTP‑only)
  const token = null; // reemplaza con tu verificación real

  if (!token) {
    // redirige **en el servidor** a /login
    redirect('/login');
  }

  // Si hubiera token, renderizarías aquí tu contenido protegido:
  return (
    <div>
      Bienvenido, usuario autenticado.
    </div>
  );
}
