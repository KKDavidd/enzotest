import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
function firebaseSideEffects(): Plugin {
  return {
    name: "firebase-side-effects",
    enforce: "pre",
    transform(code, id) {
      if (
        id.includes("@firebase/firestore") ||
        id.includes("@firebase/auth") ||
        id.includes("@firebase/app")
      ) {
return code.replace(/\/\*#__PURE__\*\//g, "");
      }
    }
  };
}

export default defineConfig({
  base: "/admin/",
  plugins: [firebaseSideEffects(), react()],
  server: { port: 5173 },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
