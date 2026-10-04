(() => {
  "use strict";

  // 配信が始まったら Google Play の URL を入れる（空のあいだは「近日配信予定」表示）
  const PLAY_URL = "";

  document.documentElement.classList.add("js");

  /* ---------- ヘッダー ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Google Play リンク ---------- */
  const status = document.getElementById("play-status");
  document.querySelectorAll(".play-link").forEach((a) => {
    if (PLAY_URL) {
      a.href = PLAY_URL;
      a.target = "_blank";
      a.rel = "noopener";
    } else if (a.closest(".download-cta")) {
      a.classList.add("is-disabled");
      a.setAttribute("aria-disabled", "true");
    }
  });
  if (PLAY_URL && status) status.textContent = "Google Play にて配信中";

  /* ---------- トップの MV（ふだんは無音でループ、ボタンで音つき・最初から 1 回通して見せる） ---------- */
  const hero = document.getElementById("hero");
  const mv = document.getElementById("hero-video");
  const mvButton = document.getElementById("mv-sound");
  if (mv && mvButton) {
    const mvLabel = mvButton.querySelector("span");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setSound = (on) => {
      mv.muted = !on;
      mv.loop = !on;
      hero.classList.toggle("mv-on", on);
      mvButton.setAttribute("aria-pressed", String(on));
      mvLabel.textContent = on ? "音を消す" : "音を出してMVを見る";
      if (on) mv.currentTime = 0;
      if (on || !reduceMotion) mv.play().catch(() => { });
      else mv.pause();
    };
    mvButton.addEventListener("click", () => setSound(mv.muted));
    mv.addEventListener("ended", () => setSound(false));
    if (reduceMotion) mv.pause();

    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) {
        if (!mv.muted) setSound(false);
        mv.pause();
      } else if (!reduceMotion) {
        mv.play().catch(() => { });
      }
    }, { threshold: 0.2 }).observe(hero);
  }

  /* ---------- 追従する購入バー（ヒーローと購入欄が見えている間は隠す） ---------- */
  const sticky = document.getElementById("sticky-cta");
  const stickyLink = sticky.querySelector("a");
  const visible = new Set();
  const stickyIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const show = visible.size === 0;
    sticky.classList.toggle("show", show);
    sticky.setAttribute("aria-hidden", String(!show));
    stickyLink.tabIndex = show ? 0 : -1;
  }, { threshold: 0.05 });
  stickyIo.observe(document.querySelector(".hero"));
  stickyIo.observe(document.getElementById("download"));

  /* ---------- スクロール出現 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("shown");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- ものがたり ---------- */
  const pics = document.querySelectorAll(".story-pic");
  const cards = document.querySelectorAll(".story-card");
  const dots = document.querySelectorAll(".story-dots button");
  let chapter = 0;
  let storyTimer = null;

  const showChapter = (n) => {
    chapter = (n + pics.length) % pics.length;
    [pics, cards, dots].forEach((list) => list.forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.ch) === chapter);
    }));
  };
  const restartStoryTimer = () => {
    clearInterval(storyTimer);
    storyTimer = setInterval(() => showChapter(chapter + 1), 9000);
  };
  document.querySelector(".story-prev").addEventListener("click", () => { showChapter(chapter - 1); restartStoryTimer(); });
  document.querySelector(".story-next").addEventListener("click", () => { showChapter(chapter + 1); restartStoryTimer(); });
  dots.forEach((d) => d.addEventListener("click", () => { showChapter(Number(d.dataset.ch)); restartStoryTimer(); }));
  restartStoryTimer();

  /* ---------- 登場人物 ---------- */
  const CHARAS = [
    { img: "lucas", name: "リュカ", en: "LUCAS", role: "主人公 ／ 辺境伯家の三男",
      quote: "「……置いていかない」",
      desc: "継承式典で名を呼ばれなかった18歳の「余り物」。口数は少ないが、目の前の誰かを見捨てない。ときおり、誰にも聞こえない鼓動を耳にする。" },
    { img: "kuro", name: "クロ", en: "KURO", role: "相棒 ／ 口をきく黒猫",
      quote: "「魚をよこせ。代わりに、死なない程度には守ってやる」",
      desc: "魚しか食べない、皮肉屋の黒猫。家出の夜にリュカと契約を結び、いつも肩の上にいる。なぜ彼を守るのかは、決して語らない。" },
    { img: "eliana", name: "エリアーナ", en: "ELIANA", role: "王女騎士",
      quote: "「この国を覚えている人が、ひとりでもいる限り……わたしは剣を捨てない！」",
      desc: "王国の王女にして、剣の腕は騎士にも劣らない。気位が高く、まっすぐな性格。" },
  ];

  const charaImg = document.getElementById("chara-img");
  const fields = ["name", "en", "role", "quote", "desc"].reduce((o, k) => {
    o[k] = document.getElementById(`chara-${k}`);
    return o;
  }, {});
  const charaButtons = document.querySelectorAll(".chara-list button");
  CHARAS.forEach((c) => { new Image().src = `img/chara/${c.img}.jpg`; });

  const showChara = (i) => {
    const c = CHARAS[i];
    charaButtons.forEach((b) => b.classList.toggle("active", Number(b.dataset.i) === i));
    charaImg.classList.add("swap");
    setTimeout(() => {
      charaImg.src = `img/chara/${c.img}.jpg`;
      charaImg.alt = c.name;
      Object.keys(fields).forEach((k) => { fields[k].textContent = c[k]; });
      fields.quote.hidden = !c.quote;
      charaImg.classList.remove("swap");
    }, 250);
  };
  charaButtons.forEach((b) => b.addEventListener("click", () => showChara(Number(b.dataset.i))));

  /* ---------- 画面ギャラリー（拡大表示） ---------- */
  const shots = [...document.querySelectorAll(".shot")];
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  let shotIndex = 0;

  const openShot = (i) => {
    shotIndex = (i + shots.length) % shots.length;
    const s = shots[shotIndex];
    lbImg.src = s.dataset.src;
    lbImg.alt = s.dataset.cap;
    lbCap.textContent = s.dataset.cap;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const closeShot = () => {
    lb.hidden = true;
    document.body.style.overflow = "";
  };
  shots.forEach((s, i) => s.addEventListener("click", () => openShot(i)));
  lb.querySelector(".lb-close").addEventListener("click", closeShot);
  lb.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); openShot(shotIndex - 1); });
  lb.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); openShot(shotIndex + 1); });
  lb.addEventListener("click", (e) => { if (e.target === lb) closeShot(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeShot();
    if (e.key === "ArrowLeft") openShot(shotIndex - 1);
    if (e.key === "ArrowRight") openShot(shotIndex + 1);
  });
})();
