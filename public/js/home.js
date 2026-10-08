(function () {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    /* ---------- 1. Scroll reveal ---------- */
    var items = document.querySelectorAll("[data-reveal]");

    if ("IntersectionObserver" in window && items.length) {
        document.documentElement.classList.add("reveal-on");

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                var el = entry.target;
                var siblings = Array.prototype.filter.call(
                    el.parentElement.children,
                    function (n) { return n.hasAttribute("data-reveal"); }
                );
                var order = siblings.indexOf(el);

                el.style.transitionDelay = order * 90 + "ms";
                el.classList.add("in");

                // hapus delay biar efek hover nggak ikut telat
                setTimeout(function () { el.style.transitionDelay = ""; }, 1000);

                io.unobserve(el);
            });
        }, { threshold: 0.15 });

        items.forEach(function (el) { io.observe(el); });
    }

    /* ---------- 2. Kartu hero miring ngikutin kursor ---------- */
    var hero = document.querySelector(".lp-hero");
    var mock = document.querySelector(".lp-mock");
    var canHover = window.matchMedia("(hover: hover)").matches;

    if (hero && mock && canHover) {
        hero.addEventListener("mousemove", function (e) {
            var b = hero.getBoundingClientRect();
            var x = (e.clientX - b.left) / b.width - 0.5;
            var y = (e.clientY - b.top) / b.height - 0.5;
            mock.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
            mock.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
        });

        hero.addEventListener("mouseleave", function () {
            mock.style.setProperty("--ry", "0deg");
            mock.style.setProperty("--rx", "0deg");
        });
    }

    /* ---------- 3. Status di kartu berubah sendiri ---------- */
    var badges = document.querySelectorAll(".lp-mock-card .badge");

    if (badges.length) {
        var n = 0;
        setInterval(function () {
            var b = badges[n % badges.length];
            n++;

            var wasDone = b.classList.contains("badge-green");
            b.classList.toggle("badge-green", !wasDone);
            b.classList.toggle("badge-blue", wasDone);
            b.textContent = wasDone ? "Review" : "Accepted";

            b.classList.add("flip");
            setTimeout(function () { b.classList.remove("flip"); }, 400);
        }, 2600);
    }

    /* ---------- 4. Placeholder search ngetik otomatis ---------- */
    var input = document.querySelector(".lp-search input");

    if (input) {
        var prefix = "Search a role, e.g. ";
        var original = input.placeholder;
        var roles = [
            "Frontend Developer",
            "Backend Developer",
            "UI/UX Designer",
            "Data Analyst",
            "Product Manager"
        ];
        var r = 0, c = 0, deleting = false, paused = false, timer;

        function tick() {
            if (paused) return;

            var word = roles[r];
            c += deleting ? -1 : 1;
            input.placeholder = prefix + word.slice(0, c);

            var wait = deleting ? 35 : 70;

            if (!deleting && c === word.length) {
                deleting = true;
                wait = 1400;
            } else if (deleting && c === 0) {
                deleting = false;
                r = (r + 1) % roles.length;
                wait = 350;
            }

            timer = setTimeout(tick, wait);
        }

        input.addEventListener("focus", function () {
            paused = true;
            clearTimeout(timer);
            input.placeholder = original;
        });

        input.addEventListener("blur", function () {
            if (input.value) return;
            paused = false;
            c = 0;
            deleting = false;
            tick();
        });

        timer = setTimeout(tick, 1800);
    }
})();