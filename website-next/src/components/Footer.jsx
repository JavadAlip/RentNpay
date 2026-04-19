'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0B1A3A] text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Top Footer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Discover */}
          <div>
            <h4 className="text-white font-semibold mb-4">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  New Products
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Used Products
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Rentals
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-yellow-400 hover:text-yellow-300">
                  Invest with Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help-center" className="hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect With Us</h4>

            <p className="text-sm text-gray-400 mb-4">
              Follow us on social media for updates and exclusive offers.
            </p>

            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
              >
                <Twitter size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2026 Rentnpay. All rights reserved.</p>

          <p className="mt-2 md:mt-0">Made with ❤️ for local communities</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
