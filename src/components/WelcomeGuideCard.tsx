import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "orgtool-hide-welcome-guide";

export function WelcomeGuideCard() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(KEY) === "1");
  }, []);

  if (hidden) return null;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <BookOpen className="size-4" />
        </span>
        <div>
          <p className="font-semibold">Baru di sini?</p>
          <p className="text-sm text-muted-foreground">
            Lihat panduan singkat sesuai peran kamu supaya cepat terbiasa.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link to="/guide">Lihat Panduan</Link>
        </Button>
        <button
          aria-label="Tutup"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setHidden(true);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
