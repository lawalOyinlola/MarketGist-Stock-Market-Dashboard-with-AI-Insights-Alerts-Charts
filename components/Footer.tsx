import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-800 py-6">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <span>
              © {currentYear} {SITE_NAME}. All rights reserved.
            </span>
            <span className="hidden md:inline">•</span>
            <Link
              href="/unsubscribe"
              className="hover:text-gray-300 transition-colors"
            >
              Unsubscribe
            </Link>
          </div>
          <div className="text-center md:text-right">
            <span className="text-gray-600">Built by </span>
            <a
              href="https://lawaloyinlola.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-300 transition-colors font-medium"
            >
              Yero
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
