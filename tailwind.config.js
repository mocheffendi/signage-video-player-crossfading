module.exports = {
    content: [
        "./index.html",
        "./mini.html",
        "./renderer.js",
        "./miniRenderer.js",
        "./test.html",
    ],
    safelist: [
        "bg-black",
        "text-white",
        "bg-zinc-900",
        "text-green-400",
        "text-3xl",
        "font-bold",
        "p-10",
        // tambahkan semua class yang kamu gunakan secara dinamis
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
};
