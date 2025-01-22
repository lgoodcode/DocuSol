import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t border-border z-100">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">DocuSol</h3>
            <p className="text-sm text-muted-foreground">
              Secure document signing and sharing powered by AI and blockchain
              technology.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 DocuSol. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <div className="w-5 h-5">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <title>X</title>
                  <path
                    className="fill-muted-foreground hover:fill-primary"
                    d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
                  />
                </svg>
              </div>
              <span className="sr-only">X</span>
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github size={24} />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
