// ===============================
// SUPABASE CONFIGURATION
// ===============================

const SUPABASE_URL =
    "https://iwsaqcopxhqizduvutdh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ===============================
// GALAXY ANIMATION
// ===============================

const canvas =
    document.getElementById("galaxyCanvas");

const ctx =
    canvas.getContext("2d");

let width;
let height;

let stars = [];

const STAR_COUNT = 900;

let rotation = 0;


function resizeCanvas() {

    width = canvas.width =
        window.innerWidth;

    height = canvas.height =
        window.innerHeight;

    createGalaxy();

}


function createGalaxy() {

    stars = [];

    const maxRadius =
        Math.max(width, height) * 0.75;

    for (let i = 0; i < STAR_COUNT; i++) {

        const radius =
            Math.pow(Math.random(), 0.55) *
            maxRadius;

        const arm =
            Math.floor(Math.random() * 3);

        const baseAngle =
            arm * ((Math.PI * 2) / 3);

        const spiral =
            radius * 0.006;

        const angle =
            baseAngle +
            spiral +
            (Math.random() - 0.5) * 0.8;

        stars.push({

            x: Math.cos(angle) * radius,

            y: Math.sin(angle) * radius * 0.55,

            radius:
                Math.random() * 1.5 + 0.3,

            alpha:
                Math.random() * 0.8 + 0.2,

            speed:
                Math.random() * 0.02 + 0.005,

            color:
                [
                    "255,255,255",
                    "207,224,255",
                    "255,207,138"
                ][
                    Math.floor(Math.random() * 3)
                ]

        });

    }

}


function drawGalaxy() {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    const centerX =
        width / 2;

    const centerY =
        height / 2;

    rotation += 0.0007;


    stars.forEach(star => {

        const angle =
            Math.atan2(star.y, star.x) +
            rotation;

        const distance =
            Math.sqrt(
                star.x * star.x +
                star.y * star.y
            );

        const x =
            centerX +
            Math.cos(angle) * distance;

        const y =
            centerY +
            Math.sin(angle) * distance;

        const twinkle =
            star.alpha +
            Math.sin(Date.now() * star.speed) * 0.2;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            star.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(${star.color}, ${Math.max(0.1, twinkle)})`;

        ctx.shadowBlur =
            star.radius > 1 ? 8 : 0;

        ctx.shadowColor =
            `rgba(${star.color}, 0.8)`;

        ctx.fill();

    });


    const gradient =
        ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            180
        );

    gradient.addColorStop(
        0,
        "rgba(255, 207, 138, 0.35)"
    );

    gradient.addColorStop(
        0.25,
        "rgba(139, 77, 214, 0.18)"
    );

    gradient.addColorStop(
        0.6,
        "rgba(91, 95, 239, 0.07)"
    );

    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        180,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = gradient;

    ctx.fill();

    requestAnimationFrame(drawGalaxy);

}


window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();

drawGalaxy();


// ===============================
// LOGIN SYSTEM
// ===============================

const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const email =
                document.getElementById("email")
                .value
                .trim();

            const password =
                document.getElementById("password")
                .value;


            if (!email || !password) {

                message.textContent =
                    "Please enter email and password.";

                return;
            }


            const loginButton =
                loginForm.querySelector("button");

            loginButton.disabled = true;

            loginButton.textContent =
                "Logging in...";

            message.textContent =
                "";


            // =========================
            // LOGIN
            // =========================

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


            if (error) {

                message.textContent =
                    error.message;

                loginButton.disabled = false;

                loginButton.textContent =
                    "Log in";

                return;
            }


            // =========================
            // CHECK BLOCK STATUS
            // =========================

            const {
                data: profile,
                error: profileError
            } =
                await supabaseClient
                    .from("profiles")
                    .select("is_blocked")
                    .eq("id", data.user.id)
                    .maybeSingle();


            if (profileError) {

                console.error(
                    "Profile check error:",
                    profileError
                );

                message.textContent =
                    "Unable to check account status.";

                loginButton.disabled = false;

                loginButton.textContent =
                    "Log in";

                await supabaseClient.auth.signOut();

                return;
            }


            // =========================
            // BLOCKED USER
            // =========================

            if (
                profile &&
                profile.is_blocked === true
            ) {

                message.textContent =
                    "Your account has been blocked by the admin.";

                loginButton.disabled = false;

                loginButton.textContent =
                    "Log in";

                await supabaseClient.auth.signOut();

                return;
            }


            // =========================
            // LOGIN SUCCESS
            // =========================

            message.textContent =
                "Login successful!";


            setTimeout(function() {

                window.location.href =
                    "home.html";

            }, 800);

        }
    );

}

// ===============================
// SIGNUP LINK
// ===============================

const signupLink =
    document.getElementById("signupLink");


if (signupLink) {

    signupLink.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            window.location.href =
                "signup.html";

        }
    );

}


// ===============================
// FORGOT PASSWORD
// ===============================

const forgotPassword =
    document.getElementById("forgotPassword");


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async function(event) {

            event.preventDefault();

            const email =
                document.getElementById("email")
                .value
                .trim();


            if (!email) {

                message.textContent =
                    "Please enter your email first.";

                return;

            }


            const { error } =
                await supabaseClient.auth.resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            window.location.origin +
                            "/reset-password.html"
                    }
                );


            if (error) {

                message.textContent =
                    error.message;

                return;

            }


            message.textContent =
                "Password reset email sent.";

        }
    );

}


// ===============================
// SESSION CHECK
// ===============================

async function checkUserSession() {

    const { data } =
        await supabaseClient.auth.getSession();

    console.log(
        "Current session:",
        data.session
    );

}

checkUserSession();