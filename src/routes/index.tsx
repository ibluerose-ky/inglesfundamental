import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "English For Teachers - Planeje suas Aulas em Minutos" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/page.html"
      title="English For Teachers"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
