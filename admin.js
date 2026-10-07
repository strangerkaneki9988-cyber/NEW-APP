// =========================
// INWARE ADMIN PANEL
// =========================

const SUPABASE_URL = "https://iwsaqcopxhqizduvutdh.supabase.co";
const SUPABASE_KEY = "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================
// ELEMENTS
// =========================

const loadingSection =
    document.getElementById(
        "loadingSection"
    );

const adminDashboard =
    document.getElementById(
        "adminDashboard"
    );

const accessDenied =
    document.getElementById(
        "accessDenied"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );

const deniedBackBtn =
    document.getElementById(
        "deniedBackBtn"
    );


// =========================
// BACK BUTTON
// =========================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "home.html";

        }
    );

}


if (deniedBackBtn) {

    deniedBackBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "home.html";

        }
    );

}


// =========================
// CHECK ADMIN
// =========================

async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error: authError
        } = await supabaseClient
            .auth
            .getUser();


        if (
            authError ||
            !user
        ) {

            showAccessDenied();

            return;

        }


        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("is_admin")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


        if (
            profileError
        ) {

            console.error(
                "Admin check error:",
                profileError
            );

            showAccessDenied();

            return;

        }


        if (
            !profile ||
            profile.is_admin !== true
        ) {

            showAccessDenied();

            return;

        }


        // Admin confirmed
        showAdminDashboard();


        // Load dashboard statistics
        await loadStats();

    }

    catch (error) {

        console.error(
            "Admin system error:",
            error
        );

        showAccessDenied();

    }

}


// =========================
// SHOW ADMIN
// =========================

function showAdminDashboard() {

    if (loadingSection) {
        loadingSection.style.display =
            "none";
    }

    if (accessDenied) {
        accessDenied.style.display =
            "none";
    }

    if (adminDashboard) {
        adminDashboard.style.display =
            "block";
    }

}


// =========================
// ACCESS DENIED
// =========================

function showAccessDenied() {

    if (loadingSection) {
        loadingSection.style.display =
            "none";
    }

    if (adminDashboard) {
        adminDashboard.style.display =
            "none";
    }

    if (accessDenied) {
        accessDenied.style.display =
            "block";
    }

}


// =========================
// DASHBOARD STATS
// =========================

async function loadStats() {

    // USERS

    const {
        count: usersCount,
        error: usersError
    } = await supabaseClient
        .from("profiles")
        .select(
            "*",
            {
                count: "exact",
                head: true
            }
        );


    if (!usersError) {

        const element =
            document.getElementById(
                "usersCount"
            );

        if (element) {
            element.textContent =
                usersCount || 0;
        }

    }


    // POSTS

    const {
        count: postsCount,
        error: postsError
    } = await supabaseClient
        .from("posts")
        .select(
            "*",
            {
                count: "exact",
                head: true
            }
        );


    if (!postsError) {

        const element =
            document.getElementById(
                "postsCount"
            );

        if (element) {
            element.textContent =
                postsCount || 0;
        }

    }


    // GROUPS

    const {
        count: groupsCount,
        error: groupsError
    } = await supabaseClient
        .from("groups")
        .select(
            "*",
            {
                count: "exact",
                head: true
            }
        );


    if (!groupsError) {

        const element =
            document.getElementById(
                "groupsCount"
            );

        if (element) {
            element.textContent =
                groupsCount || 0;
        }

    }


    // MESSAGES

    const {
        count: messagesCount,
        error: messagesError
    } = await supabaseClient
        .from("messages")
        .select(
            "*",
            {
                count: "exact",
                head: true
            }
        );


    if (!messagesError) {

        const element =
            document.getElementById(
                "messagesCount"
            );

        if (element) {
            element.textContent =
                messagesCount || 0;
        }

    }

}


// =========================
// START
// =========================

// =========================
// USER MANAGEMENT
// =========================

const userSearch =
    document.getElementById("userSearch");

const usersList =
    document.getElementById("usersList");

let allUsers = [];


// =========================
// LOAD USERS
// =========================

async function loadUsers() {

    if (!usersList) {
        return;
    }

    usersList.textContent = "Loading users...";

    const result = await supabaseClient
        .from("profiles")
        .select(
           "id, username, is_admin, is_blocked"
        )
        .order(
            "username",
            {
                ascending: true
            }
        );

    if (result.error) {

        console.error(
            "Users load error:",
            result.error
        );

        usersList.textContent =
            "Error: " +
            (result.error.message || "Unknown error");

        return;
    }

    allUsers = result.data || [];

    renderUsers(allUsers);
}

// =========================
// DISPLAY USERS
// =========================

function renderUsers(users) {

    if (!usersList) {
        return;
    }

    if (!users.length) {
        usersList.textContent =
            "No users found.";
        return;
    }

    usersList.innerHTML = "";

    users.forEach(function (user) {

        const row =
            document.createElement("div");

        row.className =
            "user-row";


        // =========================
        // USER INFO
        // =========================

        const info =
            document.createElement("div");

        info.className =
            "user-info";


        const name =
            document.createElement("strong");

        name.textContent =
            user.username ||
            "Unknown User";


        info.appendChild(name);


        // =========================
        // STATUS
        // =========================

        const status =
            document.createElement("span");

        if (user.is_admin === true) {

            status.textContent =
                "👑 Admin";

        } else if (user.is_blocked === true) {

            status.textContent =
                "🚫 Blocked";

        } else {

            status.textContent =
                "✅ Active";
        }


        // =========================
        // CONTROLS
        // =========================

        const controls =
            document.createElement("div");

        controls.className =
            "user-controls";


        // =========================
        // BLOCK / UNBLOCK
        // =========================

        if (user.is_admin !== true) {

            const blockBtn =
                document.createElement("button");

            blockBtn.className =
                "admin-btn user-action-btn";

            blockBtn.textContent =
                user.is_blocked === true
                    ? "🔓 Unblock"
                    : "🚫 Block";


            blockBtn.addEventListener(
                "click",
                async function () {

                    const newStatus =
                        user.is_blocked !== true;


                    const {
                        error
                    } = await supabaseClient
                        .from("profiles")
                        .update({
                            is_blocked: newStatus
                        })
                        .eq(
                            "id",
                            user.id
                        );


                    if (error) {

                        console.error(
                            "Block update error:",
                            error
                        );

                        alert(
                            "Unable to update user."
                        );

                        return;
                    }


                    user.is_blocked =
                        newStatus;


                    renderUsers(
                        allUsers
                    );

                }
            );

            

            controls.appendChild(
                blockBtn
            );
        }

// =========================
// DELETE USER
// =========================

if (user.is_admin !== true) {

    const deleteBtn =
        document.createElement("button");

    deleteBtn.className =
        "admin-btn user-action-btn";

    deleteBtn.textContent =
        "🗑️ Delete";


    deleteBtn.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "Are you sure you want to delete @" +
                    (user.username || "this user") +
                    "?"
                );


            if (!confirmed) {
                return;
            }


            deleteBtn.disabled = true;

            deleteBtn.textContent =
                "Deleting...";


            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "admin_delete_user",
                    {
                        p_user_id: user.id
                    }
                );


            if (error) {

                console.error(
                    "Delete user error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to delete user."
                );

                deleteBtn.disabled = false;

                deleteBtn.textContent =
                    "🗑️ Delete";

                return;
            }


            if (data === true) {

                alert(
                    "User deleted successfully."
                );


                allUsers =
                    allUsers.filter(
                        function (item) {

                            return (
                                item.id !==
                                user.id
                            );

                        }
                    );


                renderUsers(
                    allUsers
                );

            }

        }
    );


    controls.appendChild(
        deleteBtn
    );

}
        // =========================
        // ADD STATUS
        // =========================

        controls.appendChild(
            status
        );


        // =========================
        // ADD TO ROW
        // =========================

        row.appendChild(info);

        row.appendChild(controls);

        usersList.appendChild(row);

    });
}

// =========================
// SEARCH USERS
// =========================

if (userSearch) {

    userSearch.addEventListener(
        "input",
        function () {

            const search =
                userSearch.value
                    .trim()
                    .toLowerCase();


            const filtered =
                allUsers.filter(
                    function (user) {

                        return (
                            (user.username || "")
                                .toLowerCase()
                                .includes(search)
                        );

                    }
                );


            renderUsers(filtered);

        }
    );

}


// =========================
// START USER MANAGEMENT
// =========================

async function startUserManagement() {

    await loadUsers();

}


// =========================
// POST MANAGEMENT
// =========================

const postsList =
    document.getElementById("postsList");

let allPosts = [];


// =========================
// LOAD POSTS
// =========================

async function loadPosts() {

    if (!postsList) {
        return;
    }

    postsList.textContent =
        "Loading posts...";


    const result =
        await supabaseClient
            .from("posts")
            .select(
                "id, user_id, image_url, caption, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (result.error) {

        console.error(
            "Posts load error:",
            result.error
        );

        postsList.textContent =
            "Error: " +
            result.error.message;

        return;
    }


    allPosts =
        result.data || [];


    renderPosts(allPosts);
}


// =========================
// DISPLAY POSTS
// =========================

function renderPosts(posts) {

    if (!postsList) {
        return;
    }


    if (!posts.length) {

        postsList.textContent =
            "No posts found.";

        return;
    }


    postsList.innerHTML = "";


    posts.forEach(
        function(post) {

            const row =
                document.createElement("div");

            row.className =
                "post-admin-row";


            const image =
                document.createElement("img");

            image.src =
                post.image_url;

            image.className =
                "post-admin-image";

            image.alt =
                "Post";


            const details =
                document.createElement("div");

            details.className =
                "post-admin-details";


            const caption =
                document.createElement("strong");

            caption.textContent =
                post.caption ||
                "No caption";


            const date =
                document.createElement("small");

            date.textContent =
                new Date(
                    post.created_at
                ).toLocaleString();


            details.appendChild(
                caption
            );

            details.appendChild(
                date
            );


            const deleteBtn =
                document.createElement("button");

            deleteBtn.className =
                "admin-btn user-action-btn";

            deleteBtn.textContent =
                "🗑️ Delete";


            deleteBtn.addEventListener(
                "click",
                async function() {

                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this post?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    deleteBtn.disabled =
                        true;

                    deleteBtn.textContent =
                        "Deleting...";


                    const result =
                        await supabaseClient
                            .rpc(
                                "admin_delete_post",
                                {
                                    p_post_id:
                                        post.id
                                }
                            );


                    if (result.error) {

                        console.error(
                            "Delete post error:",
                            result.error
                        );

                        alert(
                            result.error.message ||
                            "Unable to delete post."
                        );

                        deleteBtn.disabled =
                            false;

                        deleteBtn.textContent =
                            "🗑️ Delete";

                        return;
                    }


                    alert(
                        "Post deleted successfully."
                    );


                    allPosts =
                        allPosts.filter(
                            function(item) {

                                return (
                                    item.id !==
                                    post.id
                                );

                            }
                        );


                    renderPosts(
                        allPosts
                    );

                }
            );


            row.appendChild(image);

            row.appendChild(details);

            row.appendChild(deleteBtn);

            postsList.appendChild(row);

        }
    );
}


// =========================
// GROUP MANAGEMENT
// =========================

const groupsList =
    document.getElementById("groupsList");

let allGroups = [];


async function loadGroups() {

    if (!groupsList) {
        return;
    }

    groupsList.textContent =
        "Loading groups...";


    const result =
        await supabaseClient
            .from("groups")
            .select(
                "id, name, created_by, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (result.error) {

        console.error(
            "Groups load error:",
            result.error
        );

        groupsList.textContent =
            "Error: " +
            result.error.message;

        return;
    }


    allGroups =
        result.data || [];


    renderGroups(
        allGroups
    );
}


function renderGroups(groups) {

    if (!groupsList) {
        return;
    }


    if (!groups.length) {

        groupsList.textContent =
            "No groups found.";

        return;
    }


    groupsList.innerHTML = "";


    groups.forEach(
        function(group) {

            const row =
                document.createElement("div");

            row.className =
                "user-row";


            const info =
                document.createElement("div");

            info.className =
                "user-info";


            const name =
                document.createElement("strong");

            name.textContent =
                group.name ||
                "Unnamed Group";


            const date =
                document.createElement("small");

            date.textContent =
                new Date(
                    group.created_at
                ).toLocaleString();


            info.appendChild(name);

            info.appendChild(date);


            const controls =
                document.createElement("div");

            controls.className =
                "user-controls";


            const deleteBtn =
                document.createElement("button");

            deleteBtn.className =
                "admin-btn user-action-btn";

            deleteBtn.textContent =
                "🗑️ Delete";


            deleteBtn.addEventListener(
                "click",
                async function() {

                    const confirmed =
                        confirm(
                            "Are you sure you want to delete the group '" +
                            (group.name || "this group") +
                            "'?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    deleteBtn.disabled =
                        true;

                    deleteBtn.textContent =
                        "Deleting...";


                    const result =
                        await supabaseClient
                            .rpc(
                                "admin_delete_group",
                                {
                                    p_group_id:
                                        group.id
                                }
                            );


                    if (result.error) {

                        console.error(
                            "Delete group error:",
                            result.error
                        );

                        alert(
                            result.error.message ||
                            "Unable to delete group."
                        );

                        deleteBtn.disabled =
                            false;

                        deleteBtn.textContent =
                            "🗑️ Delete";

                        return;
                    }


                    alert(
                        "Group deleted successfully."
                    );


                    allGroups =
                        allGroups.filter(
                            function(item) {

                                return (
                                    item.id !==
                                    group.id
                                );

                            }
                        );


                    renderGroups(
                        allGroups
                    );

                }
            );


            controls.appendChild(
                deleteBtn
            );


            row.appendChild(info);

            row.appendChild(controls);

            groupsList.appendChild(row);

        }
    );
}


// =========================
// MESSAGE MANAGEMENT
// =========================

const messagesList =
    document.getElementById("messagesList");

let allMessages = [];


async function loadMessages() {

    if (!messagesList) {
        return;
    }

    messagesList.textContent =
        "Loading messages...";


    const result =
        await supabaseClient
            .from("messages")
            .select(
                "id, sender_id, receiver_id, text, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (result.error) {

        console.error(
            "Messages load error:",
            result.error
        );

        messagesList.textContent =
            "Error: " +
            result.error.message;

        return;
    }


    allMessages =
        result.data || [];


    renderMessages(
        allMessages
    );
}


function renderMessages(messages) {

    if (!messagesList) {
        return;
    }


    if (!messages.length) {

        messagesList.textContent =
            "No messages found.";

        return;
    }


    messagesList.innerHTML = "";


    messages.forEach(
        function(message) {

            const row =
                document.createElement("div");

            row.className =
                "user-row";


            const info =
                document.createElement("div");

            info.className =
                "user-info";


            const text =
                document.createElement("strong");

            text.textContent =
                message.text ||
                "(Empty message)";


            const details =
                document.createElement("small");

            details.textContent =
                "Sender: " +
                message.sender_id +
                " | Receiver: " +
                message.receiver_id +
                " | " +
                new Date(
                    message.created_at
                ).toLocaleString();


            info.appendChild(text);

            info.appendChild(details);


            const controls =
                document.createElement("div");

            controls.className =
                "user-controls";


            const deleteBtn =
                document.createElement("button");

            deleteBtn.className =
                "admin-btn user-action-btn";

            deleteBtn.textContent =
                "🗑️ Delete";


            deleteBtn.addEventListener(
                "click",
                async function() {

                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this message?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    deleteBtn.disabled =
                        true;

                    deleteBtn.textContent =
                        "Deleting...";


                    const result =
                        await supabaseClient
                            .rpc(
                                "admin_delete_message",
                                {
                                    p_message_id:
                                        message.id
                                }
                            );


                    if (result.error) {

                        console.error(
                            "Delete message error:",
                            result.error
                        );

                        alert(
                            result.error.message ||
                            "Unable to delete message."
                        );

                        deleteBtn.disabled =
                            false;

                        deleteBtn.textContent =
                            "🗑️ Delete";

                        return;
                    }


                    alert(
                        "Message deleted successfully."
                    );


                    allMessages =
                        allMessages.filter(
                            function(item) {

                                return (
                                    item.id !==
                                    message.id
                                );

                            }
                        );


                    renderMessages(
                        allMessages
                    );

                }
            );


            controls.appendChild(
                deleteBtn
            );


            row.appendChild(info);

            row.appendChild(controls);

            messagesList.appendChild(row);

        }
    );
}


// =========================
// ADMIN SETTINGS
// =========================

const refreshAdminBtn =
    document.getElementById("refreshAdminBtn");

const adminSecurityBtn =
    document.getElementById("adminSecurityBtn");

const securityStatus =
    document.getElementById("securityStatus");


if (refreshAdminBtn) {

    refreshAdminBtn.addEventListener(
        "click",
        async function() {

            refreshAdminBtn.disabled =
                true;

            refreshAdminBtn.textContent =
                "🔄 Refreshing...";


            await loadStats();
            await loadUsers();
            await loadPosts();
            await loadGroups();
            await loadMessages();


            refreshAdminBtn.disabled =
                false;

            refreshAdminBtn.textContent =
                "🔄 Refresh Dashboard";

        }
    );

}


if (adminSecurityBtn) {

    adminSecurityBtn.addEventListener(
        "click",
        function() {

            securityStatus.innerHTML =
                "🛡️ <strong>Admin Security Active</strong><br>" +
                "Only users with <strong>is_admin = true</strong> " +
                "can access admin controls.";

        }
    );

}

checkAdmin();
startUserManagement();
loadPosts();
loadGroups();
loadMessages();