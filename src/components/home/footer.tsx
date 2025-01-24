import Link from "next/link";
import { useRef } from "react";
import { Github } from "lucide-react";

import {
  GITHUB_URL,
  CONTRACT_ADDRESS,
  X_URL,
  DEXSCREENER_URL,
} from "@/constants";
import { CopyButton } from "@/components/ui/copy-button";

export function Footer() {
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <footer className="bg-black/95 border-t border-border z-100 text-white">
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">DocuSol</h3>
            <p className="text-sm text-gray-400">
              Secure document signing and sharing powered by AI and blockchain
              technology.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">
              Documentation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/api-documentation"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  API Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="https://solana-labs.github.io/solana-web3.js/"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  JavaScript SDK
                </Link>
              </li>
              <li>
                <Link
                  href="https://solana.com/docs/clients/javascript"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Solana API
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Solana</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="https://solana.com/developers/courses/program-security"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.quicknode.com/guides/solana-development/getting-started/how-to-use-the-solana-memo-program"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Blockchain
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="mailto:inquiries@docusol.app"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  inquiries@docusol.app
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {CONTRACT_ADDRESS && (
          <div className="mt-12 flex flex-col justify-between items-center">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Contract Address
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                  <button
                    onClick={() => copyButtonRef.current?.click()}
                    className="hover:text-white transition-colors break-all"
                  >
                    {CONTRACT_ADDRESS}
                  </button>
                  <CopyButton ref={copyButtonRef} value={CONTRACT_ADDRESS} />
                </div>
              </li>
            </ul>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-800 dark:border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; 2024 DocuSol. All rights reserved.
          </p>
          <div className="flex items-center space-x-5 mt-4 md:mt-0">
            {X_URL && (
              <Link
                href={X_URL}
                target="_blank"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-5 h-5">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>X</title>
                    <path
                      className="fill-gray-400 hover:fill-white"
                      d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
                    />
                  </svg>
                </div>
                <span className="sr-only">X</span>
              </Link>
            )}
            {GITHUB_URL && (
              <Link
                href={GITHUB_URL}
                target="_blank"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github size={24} />
                <span className="sr-only">GitHub</span>
              </Link>
            )}

            {DEXSCREENER_URL && (
              <Link
                href={DEXSCREENER_URL}
                target="_blank"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-6 h-6 fill-current">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    fill-rule="evenodd"
                    viewBox="0 0 252 300"
                    focusable="false"
                  >
                    <path d="M151.818 106.866c9.177-4.576 20.854-11.312 32.545-20.541 2.465 5.119 2.735 9.586 1.465 13.193-.9 2.542-2.596 4.753-4.826 6.512-2.415 1.901-5.431 3.285-8.765 4.033-6.326 1.425-13.712.593-20.419-3.197m1.591 46.886l12.148 7.017c-24.804 13.902-31.547 39.716-39.557 64.859-8.009-25.143-14.753-50.957-39.556-64.859l12.148-7.017a5.95 5.95 0 003.84-5.845c-1.113-23.547 5.245-33.96 13.821-40.498 3.076-2.342 6.434-3.518 9.747-3.518s6.671 1.176 9.748 3.518c8.576 6.538 14.934 16.951 13.821 40.498a5.95 5.95 0 003.84 5.845zM126 0c14.042.377 28.119 3.103 40.336 8.406 8.46 3.677 16.354 8.534 23.502 14.342 3.228 2.622 5.886 5.155 8.814 8.071 7.897.273 19.438-8.5 24.796-16.709-9.221 30.23-51.299 65.929-80.43 79.589-.012-.005-.02-.012-.029-.018-5.228-3.992-11.108-5.988-16.989-5.988s-11.76 1.996-16.988 5.988c-.009.005-.017.014-.029.018-29.132-13.66-71.209-49.359-80.43-79.589 5.357 8.209 16.898 16.982 24.795 16.709 2.929-2.915 5.587-5.449 8.814-8.071C69.31 16.94 77.204 12.083 85.664 8.406 97.882 3.103 111.959.377 126 0m-25.818 106.866c-9.176-4.576-20.854-11.312-32.544-20.541-2.465 5.119-2.735 9.586-1.466 13.193.901 2.542 2.597 4.753 4.826 6.512 2.416 1.901 5.432 3.285 8.766 4.033 6.326 1.425 13.711.593 20.418-3.197"></path>
                    <path d="M197.167 75.016c6.436-6.495 12.107-13.684 16.667-20.099l2.316 4.359c7.456 14.917 11.33 29.774 11.33 46.494l-.016 26.532.14 13.754c.54 33.766 7.846 67.929 24.396 99.193l-34.627-27.922-24.501 39.759-25.74-24.231L126 299.604l-41.132-66.748-25.739 24.231-24.501-39.759L0 245.25c16.55-31.264 23.856-65.427 24.397-99.193l.14-13.754-.016-26.532c0-16.721 3.873-31.578 11.331-46.494l2.315-4.359c4.56 6.415 10.23 13.603 16.667 20.099l-2.01 4.175c-3.905 8.109-5.198 17.176-2.156 25.799 1.961 5.554 5.54 10.317 10.154 13.953 4.48 3.531 9.782 5.911 15.333 7.161 3.616.814 7.3 1.149 10.96 1.035-.854 4.841-1.227 9.862-1.251 14.978L53.2 160.984l25.206 14.129a41.926 41.926 0 015.734 3.869c20.781 18.658 33.275 73.855 41.861 100.816 8.587-26.961 21.08-82.158 41.862-100.816a41.865 41.865 0 015.734-3.869l25.206-14.129-32.665-18.866c-.024-5.116-.397-10.137-1.251-14.978 3.66.114 7.344-.221 10.96-1.035 5.551-1.25 10.854-3.63 15.333-7.161 4.613-3.636 8.193-8.399 10.153-13.953 3.043-8.623 1.749-17.689-2.155-25.799l-2.01-4.175z"></path>
                  </svg>
                </div>
                <span className="sr-only">DexScreener</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
