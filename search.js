// ============================
// INWARE SEARCH
// ============================

const SUPABASE_URL =
    "https://iwsaqcopxhqizduvutdh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ============================
// ELEMENTS
// ============================

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const clearBtn = document.getElementById("clearBtn");
const backBtn = document.getElementById("backBtn");

function renderSearchAvatar(element, user) {
    const avatarUrl = typeof user?.avatar_idx === "string" && /^https?:\/\//i.test(user.avatar_idx)
        ? user.avatar_idx
        : "";
    if (!element || !avatarUrl) return;
    const image = document.createElement("img");
    image.src = avatarUrl;
    image.alt = "";
    element.replaceChildren(image);
}


// ============================
// LOGIN CHECK
// ============================

async function checkLogin() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "index.html";
        return;
    }

    console.log("Search user:", session.user.email);
}


// ============================
// SEARCH USERS
// ============================

async function searchUsers() {

    const query = searchInput.value.trim();

    console.log("Searching:", query);

    if (!query) {

        searchResults.innerHTML = `
            <div class="empty-message">
                Search for users
            </div>
        `;

        clearBtn.style.display = "none";
        return;
    }

    clearBtn.style.display = "block";

    searchResults.innerHTML = `
        <div class="empty-message">
            Searching...
        </div>
    `;


    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, name, avatar_idx")
        .ilike("username", `%${query}%`)
        .limit(20);


    console.log("Search data:", data);
    console.log("Search error:", error);


    if (error) {

        searchResults.innerHTML = `
            <div class="empty-message">
                Search error: ${error.message}
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        searchResults.innerHTML = `
            <div class="empty-message">
                No users found
            </div>
        `;

        return;
    }


    searchResults.innerHTML = "";


    data.forEach(function(user) {

        const firstLetter =
            (user.name || user.username || "U")
                .charAt(0)
                .toUpperCase();


        const userElement =
            document.createElement("div");

        userElement.className = "user-result";


        userElement.innerHTML = `
            <div class="user-avatar">
                ${firstLetter}
            </div>

            <div class="user-details">
                <strong>
                    @${user.username}
                </strong>

                <span>
                    ${user.name || ""}
                </span>
            </div>
        `;

        renderSearchAvatar(userElement.querySelector(".user-avatar"), user);


                userElement.addEventListener(
            "click",
            function () {

                window.location.href =
                    "profile.html?id=" + user.id;

            }
        );

        searchResults.appendChild(userElement);

    });

}


// ============================
// INPUT
// ============================

searchInput.addEventListener(
    "input",
    searchUsers
);


// ============================
// CLEAR
// ============================

clearBtn.addEventListener(
    "click",
    function() {

        searchInput.value = "";

        searchResults.innerHTML = `
            <div class="empty-message">
                Search for users
            </div>
        `;

        clearBtn.style.display = "none";

        searchInput.focus();

    }
);


// ============================
// BACK
// ============================

backBtn.addEventListener(
    "click",
    function() {

        window.location.href = "home.html";

    }
);


// ============================
// START
// ============================

checkLogin();