import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import PageHead from "@/components/PageHead";

export const metadata = { title: "Log in | NagarNazar" };

export default function LoginPage() {
  return (
    <div className="wrap page narrow">
      <PageHead title="Log in" sub="Demo accounts only. Nothing here is connected to real campus identity yet." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
