// INWARE PROFILE

const SUPABASE_URL = "https://iwsaqcopxhqizduvutdh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

let isOwnProfileView = false;

const profileAvatar = document.getElementById("profileAvatar");
const profileUsername = document.getElementById("profileUsername");
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");

const postsCount = document.getElementById("postsCount");
const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");

const followBtn = document.getElementById("followBtn");
const backBtn = document.getElementById("backBtn");
const profileView = document.getElementById("profileView");
const editProfileView = document.getElementById("editProfileView");
const connectionsView = document.getElementById("connectionsView");
const profileAction = document.getElementById("profileAction");
const avatarUploadBtn = document.getElementById("avatarUploadBtn");
const avatarFileInput = document.getElementById("avatarFileInput");
const profileOptionsBtn = document.getElementById("profileOptionsBtn");
const profileOptionsMenu = document.getElementById("profileOptionsMenu");
const profileToast = document.getElementById("profileToast");
const editProfileForm = document.getElementById("editProfileForm");
const connectionsSearchInput = document.getElementById("connectionsSearchInput");
const connectionsList = document.getElementById("connectionsList");
let viewedProfile = null;
let loggedInUserId = null;
let viewedProfileId = null;
let activeSubview = "profile";
let connectionProfiles = [];
let isFollowingViewedProfile = false;
let activeConnectionsType = "followers";

function getAvatarUrl(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value)
        ? value
        : "";
}

function renderAvatar(element, profile) {
    if (!element) return;
    element.replaceChildren();
    const avatarUrl = getAvatarUrl(profile?.avatar_idx);
    if (avatarUrl) {
        const image = document.createElement("img");
        image.src = avatarUrl;
        image.alt = "";
        element.appendChild(image);
    } else {
        element.textContent = (profile?.name || profile?.username || "U").charAt(0).toUpperCase();
    }
}

function showProfileToast(message) {
    if (!profileToast) return;
    profileToast.textContent = message;
    profileToast.classList.add("is-visible");
    clearTimeout(showProfileToast.timer);
    showProfileToast.timer = setTimeout(() => {
        profileToast.classList.remove("is-visible");
    }, 2400);
}

function setSubview(view) {
    activeSubview = view;
    profileView.hidden = view !== "profile";
    editProfileView.hidden = view !== "edit";
    connectionsView.hidden = view !== "connections";
    const title = document.getElementById("profileHeaderTitle");
    if (title) {
        title.textContent = view === "edit"
            ? "Edit Profile"
            : view === "connections"
                ? (activeConnectionsType === "following" ? "Following" : "Followers")
                : (viewedProfile?.username ? `@${viewedProfile.username}` : "Profile");
    }
}

function renderProfileActions() {
    if (!profileAction || !viewedProfile) return;
    profileAction.replaceChildren();
    if (isOwnProfileView) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "primary-action";
        editButton.textContent = "Edit Profile";
        editButton.addEventListener("click", openEditProfile);

        const shareButton = document.createElement("button");
        shareButton.type = "button";
        shareButton.textContent = "Share Profile";
        shareButton.addEventListener("click", shareProfile);
        profileAction.append(editButton, shareButton);
        return;
    }

    const followAction = document.createElement("button");
    followAction.id = "followBtn";
    followAction.textContent = isFollowingViewedProfile ? "Following" : "Follow";
    followAction.addEventListener("click", toggleFollow);

    const messageButton = document.createElement("button");
    messageButton.type = "button";
    messageButton.className = "primary-action";
    messageButton.textContent = "Message";
    messageButton.addEventListener("click", openDirectChat);
    profileAction.append(followAction, messageButton);
}

async function loadProfile() {
    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
        window.location.href = "index.html";
        return;
    }

    loggedInUserId = session.user.id;
    const urlParams = new URLSearchParams(window.location.search);
    const requestedUserId = urlParams.get("id");
    viewedProfileId = requestedUserId || loggedInUserId;
    isOwnProfileView = viewedProfileId === loggedInUserId;

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, username, name, bio, avatar_idx, is_admin")
        .eq("id", viewedProfileId)
        .maybeSingle();

    if (profileError || !profile) {
        console.error("Profile error:", profileError);
        profileName.textContent = "Profile could not be loaded";
        return;
    }

    viewedProfile = profile;
    profileUsername.textContent = profile.username ? `@${profile.username}` : "@user";
    profileName.textContent = profile.name || profile.username || "Inware user";
    profileBio.textContent = profile.bio || "";
    profileBio.hidden = !profile.bio;
    renderAvatar(profileAvatar, profile);
    avatarUploadBtn.hidden = !isOwnProfileView;
    document.getElementById("logoutBtn").hidden = !isOwnProfileView;
    document.getElementById("adminPanelBtn").style.display =
        isOwnProfileView && profile.is_admin === true ? "flex" : "none";
    document.getElementById("profileHeaderTitle").textContent = profile.username ? `@${profile.username}` : "Profile";

    const [followersResult, followingResult, postsResult] = await Promise.all([
        supabaseClient.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", viewedProfileId),
        supabaseClient.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", viewedProfileId),
        supabaseClient.from("posts").select("id, user_id, image_url, media_type, caption, created_at").eq("user_id", viewedProfileId).order("created_at", { ascending: false })
    ]);

    if (followersResult.error) console.error("Followers count error:", followersResult.error);
    if (followingResult.error) console.error("Following count error:", followingResult.error);
    followersCount.textContent = followersResult.count || 0;
    followingCount.textContent = followingResult.count || 0;

    if (postsResult.error) {
        console.error("Profile posts error:", postsResult.error);
        postsCount.textContent = "0";
        document.getElementById("userPosts").innerHTML = `<div class="empty-posts">Unable to load posts.</div>`;
    } else {
        postsCount.textContent = (postsResult.data || []).length;
        renderProfilePosts(postsResult.data || []);
    }

    if (!isOwnProfileView) {
        const { data: existingFollow, error: followCheckError } = await supabaseClient
            .from("follows")
            .select("follower_id")
            .eq("follower_id", loggedInUserId)
            .eq("following_id", viewedProfileId)
            .maybeSingle();
        if (followCheckError) console.error("Follow check error:", followCheckError);
        isFollowingViewedProfile = Boolean(existingFollow);
    }

    renderProfileActions();

    const requestedView = urlParams.get("view");
    if (requestedView === "followers" || requestedView === "following") {
        activeConnectionsType = requestedView;
        setSubview("connections");
        await loadConnections(requestedView);
    } else {
        setSubview("profile");
    }
}

function renderProfilePosts(posts) {
    const grid = document.getElementById("userPosts");
    grid.replaceChildren();
    if (posts.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-posts";
        empty.textContent = "No posts yet";
        grid.appendChild(empty);
        return;
    }

    posts.forEach(post => {
        const tile = document.createElement("a");
        tile.className = "post-item";
        tile.href = post.image_url || "#";
        tile.target = "_blank";
        tile.rel = "noopener noreferrer";
        tile.setAttribute("aria-label", post.media_type === "video" ? "Open video post" : "Open image post");

        if (post.image_url && post.media_type === "video") {
            const video = document.createElement("video");
            video.src = post.image_url;
            video.muted = true;
            video.playsInline = true;
            video.preload = "metadata";
            tile.appendChild(video);
            const indicator = document.createElement("span");
            indicator.className = "post-video-indicator";
            indicator.textContent = "▶";
            tile.appendChild(indicator);
        } else if (post.image_url) {
            const image = document.createElement("img");
            image.src = post.image_url;
            image.alt = post.caption || "Post";
            image.loading = "lazy";
            tile.appendChild(image);
        } else {
            tile.textContent = post.caption || "Post";
        }
        grid.appendChild(tile);
    });
}

async function toggleFollow() {
    const button = document.getElementById("followBtn");
    if (!button || isOwnProfileView || !viewedProfileId) return;
    button.disabled = true;
    const isFollowing = isFollowingViewedProfile;
    const result = isFollowing
        ? await supabaseClient.from("follows").delete().eq("follower_id", loggedInUserId).eq("following_id", viewedProfileId)
        : await supabaseClient.from("follows").insert({ follower_id: loggedInUserId, following_id: viewedProfileId });

    if (result.error) {
        console.error("Follow update error:", result.error);
        showProfileToast("Unable to update follow status.");
        button.disabled = false;
        return;
    }

    isFollowingViewedProfile = !isFollowing;
    button.textContent = isFollowingViewedProfile ? "Following" : "Follow";
    followersCount.textContent = Math.max(0, Number(followersCount.textContent) + (isFollowing ? -1 : 1));
    button.disabled = false;
}

async function canMessageProfile() {
    const [outgoing, incoming, targetProfile] = await Promise.all([
        supabaseClient.from("follows").select("follower_id").eq("follower_id", loggedInUserId).eq("following_id", viewedProfileId).maybeSingle(),
        supabaseClient.from("follows").select("follower_id").eq("follower_id", viewedProfileId).eq("following_id", loggedInUserId).maybeSingle(),
        supabaseClient.from("profiles").select("id, is_blocked").eq("id", viewedProfileId).maybeSingle()
    ]);
    if (outgoing.error || incoming.error || targetProfile.error || !targetProfile.data || targetProfile.data.is_blocked === true) return false;
    return Boolean(outgoing.data || incoming.data);
}

async function openDirectChat() {
    if (!await canMessageProfile()) {
        showProfileToast("You can only message people you are connected with.");
        return;
    }
    window.location.href = `chat.html?user=${encodeURIComponent(viewedProfileId)}`;
}

function openEditProfile() {
    if (!isOwnProfileView || !viewedProfile) return;
    document.getElementById("editNameInput").value = viewedProfile.name || "";
    document.getElementById("editUsernameInput").value = viewedProfile.username || "";
    document.getElementById("editBioInput").value = viewedProfile.bio || "";
    renderAvatar(document.getElementById("editProfileAvatar"), viewedProfile);
    document.getElementById("editProfileMessage").textContent = "";
    setSubview("edit");
}

async function saveProfile(event) {
    event.preventDefault();
    if (!isOwnProfileView || !viewedProfile || viewedProfile.id !== loggedInUserId) return;

    const name = document.getElementById("editNameInput").value.trim();
    const username = document.getElementById("editUsernameInput").value.trim();
    const bio = document.getElementById("editBioInput").value.trim();
    const message = document.getElementById("editProfileMessage");
    const saveButton = document.getElementById("saveProfileBtn");
    if (!/^[a-zA-Z0-9._]{3,30}$/.test(username)) {
        message.textContent = "Username must be 3-30 characters using letters, numbers, dots, or underscores.";
        message.classList.remove("success");
        return;
    }

    if (username.toLowerCase() !== (viewedProfile.username || "").toLowerCase()) {
        const { data: duplicate, error: usernameError } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("username", username)
            .neq("id", loggedInUserId)
            .limit(1);
        if (usernameError) {
            message.textContent = "Unable to validate username. Please try again.";
            message.classList.remove("success");
            return;
        }
        if (duplicate?.length) {
            message.textContent = "That username is already in use.";
            message.classList.remove("success");
            return;
        }
    }

    saveButton.disabled = true;
    message.textContent = "Saving...";
    message.classList.remove("success");
    const { data, error } = await supabaseClient
        .from("profiles")
        .update({ name, username, bio })
        .eq("id", loggedInUserId)
        .select("id, username, name, bio, avatar_idx, is_admin")
        .single();
    saveButton.disabled = false;

    if (error || !data) {
        console.error("Save profile error:", error);
        message.textContent = error?.message || "Unable to save profile.";
        return;
    }

    viewedProfile = data;
    profileUsername.textContent = data.username ? `@${data.username}` : "@user";
    profileName.textContent = data.name || data.username || "Inware user";
    profileBio.textContent = data.bio || "";
    profileBio.hidden = !data.bio;
    renderAvatar(profileAvatar, data);
    renderAvatar(document.getElementById("editProfileAvatar"), data);
    document.getElementById("profileHeaderTitle").textContent = data.username ? `@${data.username}` : "Profile";
    message.textContent = "Profile saved.";
    message.classList.add("success");
    renderProfileActions();
    showProfileToast("Profile updated");
    setTimeout(() => setSubview("profile"), 450);
}

async function uploadProfileAvatar(file) {
    if (!isOwnProfileView || !viewedProfile || viewedProfile.id !== loggedInUserId || !file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
        showProfileToast("Choose a JPG, PNG, WEBP, or GIF image.");
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        showProfileToast("Profile pictures must be 8 MB or smaller.");
        return;
    }

    avatarUploadBtn.disabled = true;
    const extension = file.name.split(".").pop().toLowerCase();
    const filePath = `${loggedInUserId}/profile-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseClient.storage
        .from("post")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        avatarUploadBtn.disabled = false;
        showProfileToast("Unable to upload profile picture.");
        return;
    }

    const { data: publicUrlData } = supabaseClient.storage.from("post").getPublicUrl(filePath);
    const { data, error } = await supabaseClient
        .from("profiles")
        .update({ avatar_idx: publicUrlData.publicUrl })
        .eq("id", loggedInUserId)
        .select("id, username, name, bio, avatar_idx")
        .single();
    avatarUploadBtn.disabled = false;

    if (error || !data) {
        console.error("Avatar profile update error:", error);
        showProfileToast("Upload finished, but the profile picture could not be saved.");
        return;
    }

    viewedProfile = data;
    renderAvatar(profileAvatar, data);
    renderAvatar(document.getElementById("editProfileAvatar"), data);
    try {
        localStorage.setItem("inware.profile.avatar.updated", JSON.stringify({ id: data.id, avatar_idx: data.avatar_idx, updated_at: Date.now() }));
    } catch {
        // The profile row remains the source of truth if local storage is unavailable.
    }
    showProfileToast("Profile picture updated");
}

async function shareProfile() {
    if (!viewedProfile) return;
    const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(viewedProfile.id)}`;
    try {
        if (navigator.share) {
            await navigator.share({ title: `@${viewedProfile.username}`, url });
            return;
        }
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
        } else {
            const copyField = document.createElement("textarea");
            copyField.value = url;
            copyField.style.position = "fixed";
            copyField.style.opacity = "0";
            document.body.appendChild(copyField);
            copyField.select();
            const copied = document.execCommand("copy");
            copyField.remove();
            if (!copied) throw new Error("Clipboard copy unavailable");
        }
        showProfileToast("Profile link copied");
    } catch (error) {
        if (error.name !== "AbortError") showProfileToast("Unable to share profile link.");
    }
}

async function loadConnections(type) {
    if (!viewedProfileId || !connectionsList) return;
    connectionsList.innerHTML = `<div class="empty-posts">Loading...</div>`;
    const isFollowingList = type === "following";
    const profileField = isFollowingList ? "following_id" : "follower_id";
    const { data: relations, error } = await supabaseClient
        .from("follows")
        .select(profileField)
        .eq(isFollowingList ? "follower_id" : "following_id", viewedProfileId);

    if (error) {
        console.error("Connections load error:", error);
        connectionsList.innerHTML = `<div class="empty-posts">Unable to load ${type}.</div>`;
        return;
    }

    const ids = [...new Set((relations || []).map(row => row[profileField]).filter(Boolean))];
    if (!ids.length) {
        connectionsList.innerHTML = `<div class="empty-posts">No ${type} yet.</div>`;
        connectionProfiles = [];
        return;
    }

    const { data: profiles, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("id, username, name, avatar_idx")
        .in("id", ids)
        .order("username", { ascending: true });
    if (profilesError) {
        console.error("Connection profiles error:", profilesError);
        connectionsList.innerHTML = `<div class="empty-posts">Unable to load ${type}.</div>`;
        return;
    }
    connectionProfiles = profiles || [];
    renderConnections();
}

function renderConnections() {
    if (!connectionsList) return;
    const query = (connectionsSearchInput?.value || "").trim().toLowerCase();
    const matches = connectionProfiles.filter(profile =>
        (profile.name || "").toLowerCase().includes(query) ||
        (profile.username || "").toLowerCase().includes(query)
    );
    connectionsList.replaceChildren();
    if (!matches.length) {
        const empty = document.createElement("div");
        empty.className = "empty-posts";
        empty.textContent = query ? "No people match your search." : "No connections found.";
        connectionsList.appendChild(empty);
        return;
    }

    matches.forEach(profile => {
        const row = document.createElement("div");
        row.className = "connection-row";
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "connection-open";
        const avatar = document.createElement("span");
        avatar.className = "connection-avatar";
        renderAvatar(avatar, profile);
        const identity = document.createElement("span");
        identity.className = "connection-identity";
        const name = document.createElement("strong");
        name.textContent = profile.name || profile.username || "Inware user";
        const username = document.createElement("small");
        username.textContent = profile.username ? `@${profile.username}` : "@user";
        identity.append(name, username);
        openButton.append(avatar, identity);
        openButton.addEventListener("click", () => {
            const returnTo = `${window.location.pathname}${window.location.search}`;
            window.location.href = `profile.html?id=${encodeURIComponent(profile.id)}&returnTo=${encodeURIComponent(returnTo)}`;
        });
        row.appendChild(openButton);

        if (profile.id !== loggedInUserId) {
            const stateButton = document.createElement("button");
            stateButton.type = "button";
            stateButton.className = "connection-follow-btn";
            stateButton.textContent = "Follow";
            stateButton.addEventListener("click", async () => {
                stateButton.disabled = true;
                const { data: relation } = await supabaseClient.from("follows")
                    .select("follower_id").eq("follower_id", loggedInUserId).eq("following_id", profile.id).maybeSingle();
                if (relation) {
                    const { error: deleteError } = await supabaseClient.from("follows")
                        .delete().eq("follower_id", loggedInUserId).eq("following_id", profile.id);
                    if (!deleteError) stateButton.textContent = "Follow";
                } else {
                    const { error: insertError } = await supabaseClient.from("follows")
                        .insert({ follower_id: loggedInUserId, following_id: profile.id });
                    if (!insertError) stateButton.textContent = "Following";
                }
                stateButton.disabled = false;
            });
            row.appendChild(stateButton);
            supabaseClient.from("follows").select("follower_id")
                .eq("follower_id", loggedInUserId).eq("following_id", profile.id).maybeSingle()
                .then(({ data }) => { stateButton.textContent = data ? "Following" : "Follow"; });
        }
        connectionsList.appendChild(row);
    });
}


async function legacyLoadProfile() {

    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
        window.location.href = "index.html";
        return;
    }

    const loggedInUserId = session.user.id;

    const urlParams = new URLSearchParams(
        window.location.search
    );

    const requestedUserId = urlParams.get("id");

    const profileUserId =
        requestedUserId || loggedInUserId;


    console.log("Profile user ID:", profileUserId);


    // GET PROFILE

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("id, username, name, avatar_idx")
        .eq("id", profileUserId)
        .single();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

        profileName.textContent =
            "Profile could not be loaded";

        return;
    }


    // SHOW PROFILE

    profileUsername.textContent =
        "@" + (profile.username || "username");

    profileName.textContent =
        profile.name || "inware user";

    profileBio.textContent = profile.bio || "";


    const firstLetter =
        (
            profile.name ||
            profile.username ||
            "U"
        )
        .charAt(0)
        .toUpperCase();

    profileAvatar.textContent = firstLetter;


    // FOLLOWERS

    const {
        count: followers,
        error: followersError
    } = await supabaseClient
        .from("follows")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq(
            "following_id",
            profileUserId
        );


    if (!followersError) {
        followersCount.textContent =
            followers || 0;
    }


    // FOLLOWING

    const {
        count: following,
        error: followingError
    } = await supabaseClient
        .from("follows")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq(
            "follower_id",
            profileUserId
        );


    if (!followingError) {
        followingCount.textContent =
            following || 0;
    }


    // POSTS

    postsCount.textContent = "0";


    // OWN PROFILE

    if (profileUserId === loggedInUserId) {

        followBtn.textContent =
            "Edit Profile";

        followBtn.onclick = function () {

            alert(
                "Edit Profile coming next ✏️"
            );

        };

        return;
    }


    // CHECK FOLLOW

    const {
    data: existingFollow,
    error: followCheckError
} = await supabaseClient
    .from("follows")
    .select("follower_id, following_id")
    .eq(
        "follower_id",
        loggedInUserId
    )
    .eq(
        "following_id",
        profileUserId
    )
    .maybeSingle();


    if (followCheckError) {

        console.error(
            "Follow check error:",
            followCheckError
        );

        return;
    }


    if (existingFollow) {
        followBtn.textContent =
            "Unfollow";
    } else {
        followBtn.textContent =
            "Follow";
    }


    // FOLLOW / UNFOLLOW

    followBtn.onclick = async function () {

        followBtn.disabled = true;


        // FOLLOW

        if (followBtn.textContent === "Follow") {

            const {
                error
            } = await supabaseClient
                .from("follows")
                .insert({
                    follower_id:
                        loggedInUserId,

                    following_id:
                        profileUserId
                });


            if (error) {

                console.error(
                    "Follow error:",
                    error
                );

                alert(
                    "Follow failed: " +
                    error.message
                );

                followBtn.disabled = false;

                return;
            }


            followBtn.textContent =
                "Unfollow";


            followersCount.textContent =
                Number(
                    followersCount.textContent
                ) + 1;


        } else {

            // UNFOLLOW

            const {
                error
            } = await supabaseClient
                .from("follows")
                .delete()
                .eq(
                    "follower_id",
                    loggedInUserId
                )
                .eq(
                    "following_id",
                    profileUserId
                );


            if (error) {

                console.error(
                    "Unfollow error:",
                    error
                );

                alert(
                    "Unfollow failed: " +
                    error.message
                );

                followBtn.disabled = false;

                return;
            }


            followBtn.textContent =
                "Follow";


            followersCount.textContent =
                Math.max(
                    0,
                    Number(
                        followersCount.textContent
                    ) - 1
                );

        }


        followBtn.disabled = false;

    };

}


function openConnections(type) {
    if (!viewedProfileId) return;
    activeConnectionsType = type;
    const params = new URLSearchParams(window.location.search);
    params.set("id", viewedProfileId);
    params.set("view", type);
    history.pushState({ profileSubview: "connections", type }, "", `${window.location.pathname}?${params}`);
    setSubview("connections");
    loadConnections(type);
}

function profileBack() {
    if (activeSubview !== "profile") {
        if (history.state?.profileSubview) {
            history.back();
        } else {
            setSubview("profile");
        }
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    if (
        returnTo &&
        !returnTo.startsWith("//") &&
        /(?:^|\/)(?:profile|home)\.html(?:\?|$)/.test(returnTo)
    ) {
        window.location.href = returnTo;
    } else {
        window.location.href = "home.html";
    }
}

backBtn.addEventListener("click", profileBack);
document.getElementById("followersStat").addEventListener("click", () => openConnections("followers"));
document.getElementById("followingStat").addEventListener("click", () => openConnections("following"));
connectionsSearchInput.addEventListener("input", renderConnections);
editProfileForm.addEventListener("submit", saveProfile);
avatarUploadBtn.addEventListener("click", () => avatarFileInput.click());
document.getElementById("editAvatarBtn").addEventListener("click", () => avatarFileInput.click());
avatarFileInput.addEventListener("change", async () => {
    const [file] = avatarFileInput.files || [];
    await uploadProfileAvatar(file);
    avatarFileInput.value = "";
});
document.getElementById("profileMenuShareBtn").addEventListener("click", () => {
    profileOptionsMenu.hidden = true;
    shareProfile();
});
profileOptionsBtn.addEventListener("click", () => {
    profileOptionsMenu.hidden = !profileOptionsMenu.hidden;
    profileOptionsBtn.setAttribute("aria-expanded", String(!profileOptionsMenu.hidden));
});
document.addEventListener("click", event => {
    if (!profileOptionsMenu.contains(event.target) && !profileOptionsBtn.contains(event.target)) {
        profileOptionsMenu.hidden = true;
        profileOptionsBtn.setAttribute("aria-expanded", "false");
    }
});
window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "followers" || view === "following") {
        activeConnectionsType = view;
        setSubview("connections");
        loadConnections(view);
    } else {
        setSubview("profile");
    }
});

loadProfile();

// =========================
// PROFILE SETTINGS
// =========================

const adminPanelBtn =
    document.getElementById("adminPanelBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


async function setupProfileSettings() {

    const {
        data: {
            user
        },
        error: authError
    } =
        await supabaseClient.auth.getUser();


    if (authError || !user) {

        window.location.href =
            "index.html";

        return;
    }


    // =========================
    // CHECK ADMIN
    // =========================

    if (adminPanelBtn) {

        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .maybeSingle();


        if (
            !error &&
            profile &&
            profile.is_admin === true &&
            isOwnProfileView
        ) {

            adminPanelBtn.style.display =
                "block";

        }
    }


    // =========================
    // ADMIN PANEL
    // =========================

    if (adminPanelBtn) {

        adminPanelBtn.addEventListener(
            "click",
            function() {

                window.location.href =
                    "admin.html";

            }
        );

    }


    // =========================
    // LOGOUT
    // =========================

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async function() {

                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) {
                    return;
                }


                logoutBtn.disabled =
                    true;

                logoutBtn.textContent =
                    "Logging out...";


                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    alert(
                        "Unable to logout."
                    );

                    logoutBtn.disabled =
                        false;

                    logoutBtn.textContent =
                        "🚪 Logout";

                    return;
                }


                window.location.href =
                    "index.html";

            }
        );

    }

}


setupProfileSettings();