"use strict";

const { Router } = require("express");
const passport = require("passport");
const { join } = require("path");

const dist = join(__dirname, "..", "dashboard", "out");

const router = Router();

// Landing page (new Next.js static export)
router.get("/", (req, res) => {
	res.sendFile(join(dist, "index.html"));
});

// Auth routes (keep for potential future use)
router.get("/api/login", passport.authenticate("discord"));

router.get("/api/logout", (req, res) => {
	req.session.destroy(() => {
		res.redirect("/");
	});
});

router.get("/api/callback", passport.authenticate("discord", {
	failureRedirect: "/",
}), (req, res) => {
	req.session.save(() => {
		res.redirect("/");
	});
});

module.exports = router;
