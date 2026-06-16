"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageEditor } from "@/components/admin/PageEditor";
import { Button } from "@/components/ui/Button";
import { ApiError, createPage } from "@/lib/api";
import { PagePayload } from "@/lib/types";
import { useState } from "react";

export default function NewPageView() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: PagePayload) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const page = await createPage(payload);
      router.push(`/dashboard/edit/${page.id}`);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się utworzyć strony.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Tworzenie strony</h1>
          <p className="page-description">Wprowadź HTML, CSS i JS, a następnie opublikuj.</p>
        </div>
        <Link href="/dashboard">
          <Button type="button" variant="ghost">
            Powrót do listy
          </Button>
        </Link>
      </header>

      {error ? <p className="ds-alert-error mb-6">{error}</p> : null}

      <PageEditor mode="create" isSubmitting={isSubmitting} onSubmit={handleSubmit} />
    </>
  );
}
