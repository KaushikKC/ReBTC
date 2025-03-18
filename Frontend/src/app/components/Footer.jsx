"use client";
import { motion } from "framer-motion";
import {
  FiGithub,
  FiTwitter,
  //   FiDiscord,
  FiLinkedin,
  FiArrowUpRight
} from "react-icons/fi";

const socialLinks = [
  { icon: <FiGithub />, url: "#", name: "GitHub" },
  { icon: <FiTwitter />, url: "#", name: "Twitter" },
  //   { icon: <FiDiscord />, url: "#", name: "Discord" },
  { icon: <FiLinkedin />, url: "#", name: "LinkedIn" }
];

const footerLinks = [
  {
    title: "Product",
    links: ["Features", "Security", "API", "Status"]
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Partners"]
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookie Policy", "Licenses"]
  }
];

export default function Footer() {
  const staggerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 }
    })
  };

  return (
    <footer className="bg-[#0D1117] border-t border-[#2F80ED]/20 mt-2 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-16">
          {/* Main Branding Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerVariants}
            className="flex-1"
          >
            <h3 className="text-2xl font-bold text-white mb-6 tracking-[1.5px]">
              Re<span className="text-[#F7931A]">BTC</span>
            </h3>
            <p className="text-[#E5E7EB]/80 max-w-sm mb-8">
              Revolutionizing Bitcoin yield generation through decentralized
              finance.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) =>
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-[#161B22] hover:bg-[#2F80ED]/10 transition-colors relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  variants={staggerVariants}
                  custom={index}
                >
                  <span className="text-xl text-[#E5E7EB] group-hover:text-[#F7931A] transition-colors">
                    {social.icon}
                  </span>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#161B22] px-2 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[#E5E7EB]">
                      {social.name}
                    </span>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#161B22] rotate-45" />
                  </div>
                </motion.a>
              )}
            </div>
          </motion.div>

          {/* Footer Navigation Links */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerLinks.map((section, index) =>
              <motion.div
                key={section.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerVariants}
                custom={index}
              >
                <h4 className="text-[#E5E7EB] font-semibold mb-4 text-xl">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) =>
                    <motion.li
                      key={link}
                      variants={staggerVariants}
                      custom={index + linkIndex * 0.2}
                    >
                      <a
                        href="#"
                        className="flex items-center gap-1 text-[#E5E7EB]/80 hover:text-[#F7931A] transition-colors group"
                      >
                        {link}
                        <FiArrowUpRight className="opacity-0 group-hover:opacity-100 transition-opacity text-sm" />
                      </a>
                    </motion.li>
                  )}
                </ul>
              </motion.div>
            )}
          </div>
        </div>

        {/* Divider & Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-[#2F80ED]/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#E5E7EB]/60 text-sm">
              © {new Date().getFullYear()} ReBTC. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-[#E5E7EB]/60 hover:text-[#F7931A] text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-[#E5E7EB]/60 hover:text-[#2F80ED] text-sm transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Accent Elements */}
      <motion.div
        className="absolute right-0 bottom-0 w-64 h-64 bg-[#F7931A]/10 blur-3xl -z-10"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-0 bottom-0 w-64 h-64 bg-[#2F80ED]/10 blur-3xl -z-10"
        animate={{ opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
    </footer>
  );
}
