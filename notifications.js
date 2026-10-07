// ===============================
// INWARE - Notifications
// ===============================

// Apne existing Supabase details yahan rakho
const SUPABASE_URL = "https://iwsaqcopxhqizduvutdh.supabase.co";
const SUPABASE_KEY = "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ===============================
// Back Button
// ===============================

const backBtn =
    document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", function () {
        window.location.href = "home.html";
    });
}


// ===============================
// Time Format
// ===============================

function formatTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const difference =
        Math.floor((now.getTime() - date.getTime()) / 1000);

    if (difference < 0) {
        return "Just now";
    }

    if (difference < 60) {
        return "Just now";
    }

    if (difference < 3600) {
        return Math.floor(difference / 60) + " min ago";
    }

    if (difference < 86400) {
        return Math.floor(difference / 3600) + " hours ago";
    }

    if (difference < 604800) {
        return Math.floor(difference / 86400) + " days ago";
    }

    return date.toLocaleDateString("en-IN");
}


// ===============================
// Get Username
// ===============================

async function getUsername(userId) {

    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error(
            "Username error:",
            error
        );

        return "user";
    }

    return profile?.username || "user";
}


// ===============================
// Load Notifications
// ===============================

async function loadNotifications() {

    const notificationsList =
        document.getElementById(
            "notificationsList"
        );

    notificationsList.innerHTML = `
        <div class="loading-message">
            Loading notifications...
        </div>
    `;

    // Current session check
    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {

        notificationsList.innerHTML = `
            <div class="empty-message">
                Please login first.
            </div>
        `;

        setTimeout(function () {
            window.location.href = "index.html";
        }, 1200);

        return;
    }

    const {
        data: notifications,
        error
    } = await supabaseClient
        .from("notifications")
        .select(`
            id,
            actor_id,
            type,
            post_id,
             story_id,
            message,
            group_id,
            is_read,
            created_at
        `)
        .eq("user_id", session.user.id)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Notifications load error:",
            error
        );

        notificationsList.innerHTML = `
            <div class="empty-message">
                Notifications load nahi ho pa rahi hain.
            </div>
        `;

        return;
    }

    notificationsList.innerHTML = "";

    if (
        !notifications ||
        notifications.length === 0
    ) {

        notificationsList.innerHTML = `
            <div class="empty-message">
                Abhi koi notification nahi hai 🔔
            </div>
        `;

        return;
    }

    for (const item of notifications) {

        const username =
            await getUsername(item.actor_id);

        const avatarLetter =
            username.charAt(0).toUpperCase();

        const notificationItem =
            document.createElement("div");

        notificationItem.className =
            "notification-item";
if (
    item.type === "message" ||
    item.type === "group_message" ||
    item.type === "comment" ||
    item.type === "reply" ||
    item.type === "story_mention" ||
    item.type === "story_like"
) {

    notificationItem.style.cursor = "pointer";

    notificationItem.addEventListener("click", function (event) {

        if (
            event.target.classList.contains("read-button")
        ) {
            return;
        }

        if (
            item.type === "group_message" &&
            item.group_id
        ) {
            window.location.href =
                "chat.html?group=" + item.group_id;

            return;
        }

        if (item.type === "message") {
            window.location.href =
                "chat.html?user=" + item.actor_id;

            return;
        }

        if (
            (
                item.type === "comment" ||
                item.type === "reply"
            ) &&
            item.post_id
        ) {
            window.location.href =
                "reels.html?post_id=" +
                encodeURIComponent(item.post_id);

            return;
        }

       if (
    item.type === "story_mention" &&
    item.story_id
) {
    window.location.href =
        "home.html?story_id=" +
        encodeURIComponent(item.story_id) +
        "&mention=1";

    return;
}

if (
    item.type === "story_like" &&
    item.story_id
) {
    window.location.href =
        "home.html?story_id=" +
        encodeURIComponent(item.story_id) +
        "&like=1";

    return;
}

    });

}
        if (!item.is_read) {
            notificationItem.classList.add("unread");
        }

        notificationItem.innerHTML = `
            <div class="notification-avatar">
                ${avatarLetter}
            </div>

            <div class="notification-content">
                <p>
                    <strong>${username}</strong>
                    ${item.message || ""}
                </p>

                <span class="notification-time">
                    ${formatTime(item.created_at)}
                </span>
            </div>

            <button
                class="read-button"
                data-id="${item.id}"
                ${item.is_read ? "disabled" : ""}
            >
                ${item.is_read ? "Read" : "Mark read"}
            </button>
        `;

        notificationsList.appendChild(
            notificationItem
        );
    }
}


// ===============================
// Mark Notification As Read
// ===============================

document.addEventListener(
    "click",
    async function (event) {

        if (
            !event.target.classList.contains(
                "read-button"
            )
        ) {
            return;
        }

        const button =
            event.target;

        const notificationId =
            button.getAttribute("data-id");

        const {
            error
        } = await supabaseClient
            .from("notifications")
            .update({
                is_read: true
            })
            .eq("id", notificationId);

        if (error) {

            console.error(
                "Mark read error:",
                error
            );

            alert(
                "Notification read nahi ho paayi."
            );

            return;
        }

        button.textContent = "Read";
        button.disabled = true;

        const item =
            button.closest(".notification-item");

        if (item) {
            item.classList.remove("unread");
        }
    }
);

// ===============================
// Realtime Notifications
// ===============================

async function subscribeToNotifications() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        return;
    }

    supabaseClient
        .channel("notifications-" + session.user.id)

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: "user_id=eq." + session.user.id
            },
            async function (payload) {

                console.log(
                    "New notification:",
                    payload.new
                );

                await loadNotifications();
            }
        )

        .subscribe(function (status) {

            console.log(
                "Notification Realtime:",
                status
            );

        });
}
// ===============================
// Start
// ===============================

loadNotifications();
subscribeToNotifications();