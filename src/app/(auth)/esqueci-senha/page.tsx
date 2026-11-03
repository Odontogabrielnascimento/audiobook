import { ResetRequestForm } from "./ResetRequestForm";

export const metadata = { title: "Esqueci minha senha" };

export default function Page() {
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-2 text-3xl font-semibold">Esqueci minha senha</h1>
      <p className="mb-6 text-muted">Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
      <ResetRequestForm />
    </div>
  );
}
