import { motion, useScroll, useTransform } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export default function App() {
  const { scrollYProgress } = useScroll();
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const titleY = useTransform(scrollYProgress, [0, 0.45], [0, -120]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      <section className="relative isolate flex min-h-screen items-center px-6 py-10 sm:px-10 lg:px-16">
        <motion.img
          src="/kenny-aura.png"
          alt="Kenny wearing sunglasses with serious aura"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_28%]"
          style={{ scale: imageScale }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.48)_45%,rgba(0,0,0,0.1)_100%)]" />
        <div className="aura-field absolute inset-0 -z-10 opacity-70" />

        <motion.div
          className="max-w-5xl"
          style={{ y: titleY }}
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.14 }}
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 text-sm font-semibold uppercase tracking-[0.46em] text-cyan-200/90"
          >
            Claude Fable Energy
          </motion.p>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white sm:text-8xl lg:text-[10.5rem]"
          >
            Kenny Has Aura
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-xl text-lg leading-8 text-white/78 sm:text-xl"
          >
            A simple flex page for Kenny: shades on, tie sharp, hoodie clean,
            presence impossible to ignore.
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <motion.a
              href="#aura"
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.24em] text-black transition-colors hover:bg-cyan-200"
            >
              Witness Aura
            </motion.a>
            <motion.a
              href="#flex"
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center border border-white/45 px-7 py-4 text-sm font-black uppercase tracking-[0.24em] text-white transition-colors hover:border-cyan-200 hover:text-cyan-200"
            >
              See The Flex
            </motion.a>
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute bottom-8 left-6 h-px w-[calc(100%-3rem)] bg-white/25 sm:left-10 sm:w-[calc(100%-5rem)] lg:left-16 lg:w-[calc(100%-8rem)]" />
      </section>

      <section id="aura" className="relative px-6 py-28 sm:px-10 lg:px-16">
        <motion.div
          className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-cyan-100 sm:text-7xl">
            Aura Certified
          </h2>
          <p className="text-xl leading-9 text-white/70 sm:text-2xl">
            Kenny does not need to announce the flex. The sunglasses, the calm
            face, and the clean fit do the talking before anyone says a word.
          </p>
        </motion.div>
      </section>

      <section id="flex" className="relative px-6 pb-28 sm:px-10 lg:px-16">
        <motion.div
          className="mx-auto max-w-6xl border-t border-white/18 pt-14"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="max-w-3xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] sm:text-7xl">
              Calm Look. Big Presence.
            </h2>
            <p className="max-w-md text-lg leading-8 text-white/66">
              Built as a clean one-page website with animated aura light,
              cinematic motion, and Kenny as the main visual focus.
            </p>
          </div>
          <motion.div
            className="mt-16 h-2 origin-left bg-gradient-to-r from-cyan-200 via-white to-amber-300"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      </section>
    </main>
  );
}