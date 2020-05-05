if(process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const methodOverride = require("method-override");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/users");
const initializePassport = require("./passport-config");

initializePassport(passport);

mongoose.connect("mongodb+srv://devCoder0x0:"+process.env.MONGO_PASSWORD+"@cluster0-jaqgo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log("connected to Database"));

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "views")));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", checkAuthenticated, (req, res) => {
    res.render("index.ejs", { name: req.user.name });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        res.redirect("/login");
    }
    catch (e){
        if(e.message) {
            req.flash("error", "User already exists");
            res.redirect("/register");
        }
        
    }
})

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login.ejs");
})

app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.delete("/logout", (req, res) => {
    req.logOut();
    res.redirect("login");
})

function checkAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    return res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        res.redirect("/");
    }
    return next();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Listening on Port " + PORT));