// =========================
// SUPABASE CONFIG
// =========================

const SUPABASE_URL = "https://iwsaqcopxhqizduvutdh.supabase.co";
const SUPABASE_KEY = "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

const homeCommentsModal =
    document.getElementById(
        "homeCommentsModal"
    );

const homeCommentsList =
    document.getElementById(
        "homeCommentsList"
    );

const closeHomeComments =
    document.getElementById(
        "closeHomeComments"
    );

let activeHomeCommentsArticle =
    null;

const yourStory =
    document.getElementById(
        "yourStory"
    );

const storyRow =
    document.getElementById(
        "storyRow"
    );

const storyUploadModal =
    document.getElementById(
        "storyUploadModal"
    );

const storyPictureBtn =
    document.getElementById(
        "storyPictureBtn"
    );

const storyVideoBtn =
    document.getElementById(
        "storyVideoBtn"
    );

const cancelStoryUpload =
    document.getElementById(
        "cancelStoryUpload"
    );

const storyFileInput =
    document.getElementById(
        "storyFileInput"
    );

const storyUploadStatus =
    document.getElementById(
        "storyUploadStatus"
    );

const storyMentionInput =
    document.getElementById(
        "storyMentionInput"
    );

const storyMentionSuggestions =
    document.getElementById(
        "storyMentionSuggestions"
    );

const yourStoryAvatar =
    yourStory
        ? yourStory.querySelector(
            ".your-story-avatar"
        )
        : null;

const storyViewerModal =
    document.getElementById(
        "storyViewerModal"
    );

const closeStoryViewerButton =
    document.getElementById(
        "closeStoryViewer"
    );

const previousStoryButton =
    document.getElementById(
        "previousStory"
    );

const nextStoryButton =
    document.getElementById(
        "nextStory"
    );

const storyViewerMedia =
    document.getElementById(
        "storyViewerMedia"
    );

const storyViewerProgress =
    document.getElementById(
        "storyViewerProgress"
    );

const addStoryFromViewer =
    document.getElementById(
        "addStoryFromViewer"
    );

const storyViewsButton =
    document.getElementById(
        "storyViewsButton"
    );

    const storyLikeButton =
    document.getElementById(
        "storyLikeButton"
    );

const storyViewersModal =
    document.getElementById(
        "storyViewersModal"
    );

const closeStoryViewersButton =
    document.getElementById(
        "closeStoryViewers"
    );

const storyViewersList =
    document.getElementById(
        "storyViewersList"
    );

let activeStories = [];
let activeStoryIndex = 0;
let canAddCurrentStory = false;


// =========================
// CHECK LOGIN
// =========================

async function checkLogin() {

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session) {

        window.location.href =
            "index.html";

        return null;
    }

    return session;
}


// =========================
// NAVIGATION
// =========================

// SEARCH TOP
const searchBtn =
    document.getElementById(
        "searchBtn"
    );

if (searchBtn) {

    searchBtn.onclick =
        function () {

            window.location.href =
                "search.html";
        };
}


// SEARCH BOTTOM
const searchNav =
    document.getElementById(
        "searchNav"
    );

if (searchNav) {

    searchNav.onclick =
        function () {

            window.location.href =
                "search.html";
        };
}


// PROFILE
const profileNav =
    document.getElementById(
        "profileNav"
    );

if (profileNav) {

    profileNav.onclick =
        async function () {

            const session =
                await checkLogin();

            if (session) {

                window.location.href =
                    "profile.html?id=" +
                    session.user.id;
            }
        };
}


// ACTIVITY / CHAT
const chatNav = document.getElementById("chatNav");

if (chatNav) {
    chatNav.onclick = function () {
        window.location.href = "chat.html";
    };
}


// =========================
// NOTIFICATION
// =========================

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

if (notificationBtn) {

    notificationBtn.onclick =
        function () {

            window.location.href =
                "notifications.html";
        };
}


// =========================
// CREATE POST
// =========================

const createPost =
    document.getElementById(
        "createPost"
    );

const postImageInput =
    document.getElementById(
        "postImageInput"
    );

const postOptions =
    document.getElementById(
        "postOptions"
    );

const uploadPictureBtn =
    document.getElementById(
        "uploadPictureBtn"
    );

const uploadVideoBtn =
    document.getElementById(
        "uploadVideoBtn"
    );

if (
    createPost &&
    postImageInput
) {

    createPost.onclick =
    function () {

        if (!postOptions) {
            return;
        }

        postOptions.style.display =
            postOptions.style.display ===
            "flex"
                ? "none"
                : "flex";
    };

if (uploadPictureBtn) {

    uploadPictureBtn.onclick =
        function () {

            postImageInput.accept =
                "image/jpeg,image/png,image/webp,image/gif";

            postImageInput.click();

            if (postOptions) {
                postOptions.style.display =
                    "none";
            }
        };
}

if (uploadVideoBtn) {

    uploadVideoBtn.onclick =
        function () {

            postImageInput.accept =
                "video/mp4,video/webm,video/quicktime";

            postImageInput.click();

            if (postOptions) {
                postOptions.style.display =
                    "none";
            }
        };
}

    postImageInput.onchange =
        async function () {

            const file =
                postImageInput.files[0];

            if (!file) {
                return;
            }


            // =========================
            // CHECK FILE TYPE
            // =========================

            const isImage =
                file.type.startsWith(
                    "image/"
                );

            const isVideo =
                file.type.startsWith(
                    "video/"
                );


            if (
                !isImage &&
                !isVideo
            ) {

                alert(
                    "Please select an image or video."
                );

                postImageInput.value =
                    "";

                return;
            }


            // =========================
            // FILE SIZE
            // =========================

            const maxFileSize =
                50 * 1024 * 1024;


            if (
                file.size >
                maxFileSize
            ) {

                alert(
                    "File size must be 50 MB or less."
                );

                postImageInput.value =
                    "";

                return;
            }


            // =========================
            // VIDEO DURATION
            // MAX 3 MINUTES
            // =========================

            if (isVideo) {

                const video =
                    document.createElement(
                        "video"
                    );

                const videoUrl =
                    URL.createObjectURL(
                        file
                    );


                video.preload =
                    "metadata";


                video.onloadedmetadata =
                    function () {

                        URL.revokeObjectURL(
                            videoUrl
                        );


                        if (
                            video.duration >
                            180
                        ) {

                            alert(
                                "Video must be 3 minutes or less."
                            );

                            postImageInput.value =
                                "";

                            return;
                        }


                        uploadPostFile(
                            file,
                            "video"
                        );
                    };


                video.onerror =
                    function () {

                        URL.revokeObjectURL(
                            videoUrl
                        );

                        alert(
                            "Unable to read this video."
                        );

                        postImageInput.value =
                            "";
                    };


                video.src =
                    videoUrl;


                return;
            }


            // =========================
            // IMAGE UPLOAD
            // =========================

            uploadPostFile(
                file,
                "image"
            );
        };
}


// =========================
// UPLOAD POST FILE
// =========================

async function uploadPostFile(
    file,
    mediaType
) {

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();


    if (!session) {

        alert(
            "Please login first."
        );

        return;
    }


    // =========================
    // FILE EXTENSION
    // =========================

    const fileExtension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    // =========================
    // UNIQUE FILE NAME
    // =========================

    const fileName =
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2) +
        "." +
        fileExtension;


    // =========================
    // USER FOLDER
    // =========================

    const filePath =
        session.user.id +
        "/" +
        fileName;


    // =========================
    // UPLOAD FILE
    // =========================

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("post")
        .upload(
            filePath,
            file
        );


    if (uploadError) {

        console.error(
            "Upload error:",
            uploadError
        );


        alert(
            "Upload failed: " +
            uploadError.message
        );


        return;
    }


    // =========================
    // PUBLIC URL
    // =========================

    const {
        data: publicUrlData
    } = supabaseClient
        .storage
        .from("post")
        .getPublicUrl(
            filePath
        );


    const mediaUrl =
        publicUrlData.publicUrl;


    // =========================
    // VIDEO DURATION
    // =========================

    let videoDuration =
        null;


    if (
        mediaType ===
        "video"
    ) {

        const video =
            document.createElement(
                "video"
            );

        video.preload =
            "metadata";

        const videoUrl =
            URL.createObjectURL(
                file
            );


        await new Promise(
            function (resolve) {

                video.onloadedmetadata =
                    function () {

                        videoDuration =
                            Math.round(
                                video.duration
                            );

                        URL.revokeObjectURL(
                            videoUrl
                        );

                        resolve();
                    };


                video.onerror =
                    function () {

                        URL.revokeObjectURL(
                            videoUrl
                        );

                        resolve();
                    };


                video.src =
                    videoUrl;
            }
        );
    }


    // =========================
    // SAVE POST
    // =========================

    const {
        error: postError
    } = await supabaseClient
        .from("posts")
        .insert({

            user_id:
                session.user.id,

            caption:
                "Welcome to inware 🚀",

            image_url:
                mediaUrl,

            media_type:
                mediaType,

            video_duration:
                videoDuration
        });


    if (postError) {

        console.error(
            "Post error:",
            postError
        );


        alert(
            "Post failed: " +
            postError.message
        );


        return;
    }


    // =========================
    // SUCCESS
    // =========================

    if (
        mediaType ===
        "video"
    ) {

        alert(
            "Video uploaded successfully! 🎥"
        );

    } else {

        alert(
            "Post uploaded successfully! 📸"
        );
    }


    postImageInput.value =
        "";


    loadPosts();
}

function setStoryUploadStatus(message) {

    if (storyUploadStatus) {
        storyUploadStatus.textContent =
            message;
    }
}

function closeStoryUpload() {

    if (storyUploadModal) {
        storyUploadModal.style.display =
            "none";
    }

    if (storyFileInput) {
        storyFileInput.value =
            "";
    }

    if (storyMentionInput) {
        storyMentionInput.value =
            "";
    }

    if (storyMentionSuggestions) {
        storyMentionSuggestions.innerHTML =
            "";

        storyMentionSuggestions.hidden =
            true;
    }

    setStoryUploadStatus("");
}

function openStoryUploadChooser() {

    if (storyUploadModal) {
        storyUploadModal.style.display =
            "flex";
    }
}

function hideStoryMentionSuggestions() {

    if (storyMentionSuggestions) {
        storyMentionSuggestions.innerHTML =
            "";

        storyMentionSuggestions.hidden =
            true;
    }
}

async function loadStoryMentionSuggestions(query) {

    if (
        !storyMentionSuggestions ||
        !storyMentionInput
    ) {
        return;
    }

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    const profileQuery =
        supabaseClient
            .from("profiles")
            .select(
                "id, username, name"
            )
            .limit(8);

    const {
        data: profiles,
        error
    } = query
        ? await profileQuery.or(
            "username.ilike.%" +
            query +
            "%,name.ilike.%" +
            query +
            "%"
        )
        : await profileQuery;

    if (error) {
        hideStoryMentionSuggestions();
        return;
    }

    const filteredProfiles =
        (profiles || []).filter(
            function (profile) {
                return !session ||
                    profile.id !== session.user.id;
            }
        );

    if (filteredProfiles.length === 0) {
        hideStoryMentionSuggestions();
        return;
    }

    storyMentionSuggestions.innerHTML =
        "";

    filteredProfiles.forEach(
        function (profile) {

            const suggestion =
                document.createElement("button");

            suggestion.type =
                "button";

            suggestion.className =
                "story-mention-suggestion";

            const username =
                document.createElement("strong");

            username.textContent =
                "@" + profile.username;

            const name =
                document.createElement("small");

            name.textContent =
                profile.name || "";

            suggestion.appendChild(
                username
            );

            suggestion.appendChild(
                name
            );

            let suggestionSelected =
                false;

            const selectSuggestion =
                function (event) {

                    if (suggestionSelected) {
                        return;
                    }

                    suggestionSelected =
                        true;

                    if (event) {
                        event.preventDefault();
                    }

                    const value =
                        storyMentionInput.value;

                    const cursorPosition =
                        storyMentionInput.selectionStart ||
                        value.length;

                    const beforeCursor =
                        value.slice(
                            0,
                            cursorPosition
                        );

                    const mentionStart =
                        beforeCursor.lastIndexOf("@");

                    const afterCursor =
                        value.slice(
                            cursorPosition
                        );

                    storyMentionInput.value =
                        value.slice(
                            0,
                            mentionStart
                        ) +
                        "@" +
                        profile.username +
                        " " +
                        afterCursor;

                    const nextCursor =
                        mentionStart +
                        profile.username.length +
                        2;

                    storyMentionInput.focus();
                    storyMentionInput.setSelectionRange(
                        nextCursor,
                        nextCursor
                    );

                    hideStoryMentionSuggestions();
                };

            suggestion.addEventListener(
                "pointerdown",
                selectSuggestion
            );

            suggestion.addEventListener(
                "click",
                selectSuggestion
            );

            storyMentionSuggestions.appendChild(
                suggestion
            );
        }
    );

    storyMentionSuggestions.hidden =
        false;
}

function closeStoryViewer() {

    const storyViewDebug =
        document.getElementById(
            "storyViewDebug"
        );

    if (storyViewDebug) {
        storyViewDebug.remove();
    }

    if (storyViewerMedia) {
        const video =
            storyViewerMedia.querySelector(
                "video"
            );

        if (video) {
            video.pause();
            video.removeAttribute("src");
            video.load();
        }

        storyViewerMedia.innerHTML =
            "";
    }

    if (storyViewerModal) {
        storyViewerModal.style.display =
            "none";
    }

    closeStoryViewers();

    if (storyViewsButton) {
        storyViewsButton.hidden =
            true;
    }

    if (addStoryFromViewer) {
        addStoryFromViewer.hidden =
            true;
    }

    canAddCurrentStory =
        false;

    activeStories = [];
    activeStoryIndex = 0;
}

async function recordStoryView(story) {

    console.log("STORY VIEW ID:", story?.id);
    console.log("STORY OWNER:", story?.user_id);
    console.log("STORY MEDIA TYPE:", story?.media_type);

    if (!story || !story.id) {
        return;
    }

    try {

        const isUuid =
            function (value) {
                return typeof value ===
                    "string" &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                        .test(value);
            };

        const {
            data: { session }
        } = await supabaseClient
            .auth
            .getSession();

        console.log(
            "VIEWER ID:",
            session?.user?.id
        );

        if (
            !session ||
            !session.user ||
            !session.user.id
        ) {
            return;
        }

        if (
            isUuid(story.user_id) &&
            isUuid(session.user.id) &&
            story.user_id === session.user.id
        ) {
            return;
        }

        console.log(
            "VIEW INSERT STORY ID:",
            story.id
        );

        console.log(
            "VIEW INSERT VIEWER ID:",
            session.user.id
        );

        const {
            data,
            error
        } = await supabaseClient
            .from("story_views")
            .upsert(
                {
                    story_id:
                        story.id,

                    viewer_id:
                        session.user.id,

                    viewed_at:
                        new Date().toISOString()
                },
                {
                    onConflict:
                        "story_id,viewer_id",

                    ignoreDuplicates:
                        true
                }
            );

        console.log("VIEW INSERT DATA:", data);
        console.log("VIEW INSERT ERROR:", error);
        console.log(
            "VIEW INSERT ERROR MESSAGE:",
            error?.message
        );
        console.log(
            "VIEW INSERT ERROR CODE:",
            error?.code
        );
        console.log(
            "VIEW INSERT ERROR DETAILS:",
            error?.details
        );
        console.log(
            "VIEW INSERT ERROR HINT:",
            error?.hint
        );

        if (error) {
            console.error(
                "STORY VIEW INSERT ERROR:",
                error
            );
            console.error(
                "ERROR MESSAGE:",
                error?.message
            );
            console.error(
                "ERROR CODE:",
                error?.code
            );
            console.error(
                "ERROR DETAILS:",
                error?.details
            );
            console.error(
                "ERROR HINT:",
                error?.hint
            );
        }


    } catch (error) {
        console.error(
            "STORY VIEW CATCH ERROR:",
            error
        );
        console.error(
            "ERROR MESSAGE:",
            error?.message
        );
        console.error(
            "ERROR CODE:",
            error?.code
        );
        console.error(
            "ERROR DETAILS:",
            error?.details
        );
        console.error(
            "ERROR HINT:",
            error?.hint
        );
    }
}

async function updateStoryViewsButton(story) {

    if (!storyViewsButton) {
        return;
    }

    storyViewsButton.hidden =
        true;

    storyViewsButton.removeAttribute(
        "data-story-id"
    );

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (
        !session ||
        !session.user ||
        session.user.id !== story.user_id
    ) {
        return;
    }

    if (
        activeStories[activeStoryIndex]?.id !==
        story.id
    ) {
        return;
    }

    storyViewsButton.hidden =
        false;

    storyViewsButton.setAttribute(
        "data-story-id",
        story.id
    );
}

async function updateStoryLikeButton(story) {

    if (!storyLikeButton) {
        return;
    }

    storyLikeButton.hidden = true;
    storyLikeButton.removeAttribute("data-story-id");

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session || !session.user) {
        return;
    }

    // Apni Story ko like nahi karna
    if (session.user.id === story.user_id) {
        return;
    }

    if (
        activeStories[activeStoryIndex]?.id !==
        story.id
    ) {
        return;
    }

    const {
        data: myLike,
        error
    } = await supabaseClient
        .from("story_likes")
        .select("id")
        .eq("story_id", story.id)
        .eq("user_id", session.user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Story like load error:",
            error
        );
        return;
    }

    if (myLike) {
        storyLikeButton.textContent = "♥";
        storyLikeButton.classList.add("liked");
    } else {
        storyLikeButton.textContent = "♡";
        storyLikeButton.classList.remove("liked");
    }

    storyLikeButton.hidden = false;

    storyLikeButton.setAttribute(
        "data-story-id",
        story.id
    );
}

async function loadStoryViewers(storyId) {

    if (!storyViewersList) {
        return;
    }

    storyViewersList.textContent =
        "Loading viewers...";

    const {
        data: views,
        error: viewsError
    } = await supabaseClient
        .from("story_views")
        .select(
            "viewer_id, viewed_at"
        )
        .eq(
            "story_id",
            storyId
        )
        .order(
            "viewed_at",
            {
                ascending: false
            }
        );

    if (viewsError) {
        console.error(
            "Story viewers load error:",
            viewsError
        );

        storyViewersList.textContent =
            "Unable to load views.";

        return;
    }

    const viewerIds = [
        ...new Set(
            (views || [])
                .map(
                    function (view) {
                        return view.viewer_id;
                    }
                )
                .filter(Boolean)
        )
    ];

    if (viewerIds.length === 0) {
        storyViewersList.textContent =
            "No views yet";

        return;
    }

    const {
        data: profiles,
        error: profilesError
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username, name, avatar_idx"
        )
        .in(
            "id",
            viewerIds
        );

    if (profilesError) {
        console.error(
            "Story viewer profiles error:",
            profilesError
        );

        storyViewersList.textContent =
            "Unable to load viewers.";

        return;
    }

    const profileMap = {};

    (profiles || []).forEach(
        function (profile) {
            profileMap[profile.id] =
                profile;
        }
    );

    storyViewersList.innerHTML =
        "";

    viewerIds.forEach(
        function (viewerId) {

            const profile =
                profileMap[viewerId] || {};

            const viewerItem =
                document.createElement("div");

            viewerItem.className =
                "story-viewer-item";

            const avatar =
                document.createElement("div");

            avatar.className =
                "story-viewer-avatar";

            const avatarUrl =
                typeof profile.avatar_idx ===
                    "string" &&
                /^https?:\/\//.test(
                    profile.avatar_idx
                )
                    ? profile.avatar_idx
                    : "";

            if (avatarUrl) {

                const image =
                    document.createElement("img");

                image.src =
                    avatarUrl;

                image.alt =
                    profile.username ||
                    "Viewer avatar";

                avatar.appendChild(
                    image
                );

            } else {

                avatar.textContent =
                    (
                        profile.name ||
                        profile.username ||
                        "U"
                    )
                        .charAt(0)
                        .toUpperCase();
            }

            const details =
                document.createElement("div");

            details.className =
                "story-viewer-details";

            const username =
                document.createElement("strong");

            username.textContent =
                "@" +
                (profile.username || "user");

            const name =
                document.createElement("span");

            name.textContent =
                profile.name || "";

            details.appendChild(
                username
            );

            details.appendChild(
                name
            );

            viewerItem.appendChild(
                avatar
            );

            viewerItem.appendChild(
                details
            );

            storyViewersList.appendChild(
                viewerItem
            );
        }
    );
}

async function openStoryViewers(storyId) {

    if (
        !storyViewersModal ||
        !storyId
    ) {
        return;
    }

    storyViewersModal.style.display =
        "flex";

    await loadStoryViewers(
        storyId
    );
}

function closeStoryViewers() {

    if (storyViewersModal) {
        storyViewersModal.style.display =
            "none";
    }

    if (storyViewersList) {
        storyViewersList.innerHTML =
            "";
    }
}

async function saveStoryMentions(
    storyId,
    mentionedByUserId,
    mentionText
) {

    const mentionedUsernames = [
        ...new Set(
            (mentionText.match(
                /@([a-zA-Z0-9_.]+)/g
            ) || [])
                .map(
                    function (mention) {
                        return mention
                            .slice(1)
                            .toLowerCase();
                    }
                )
        )
    ];

    if (mentionedUsernames.length === 0) {
        return;
    }

    const mentionedUsers = [];

    for (const username of mentionedUsernames) {

        const {
            data: profile,
            error
        } = await supabaseClient
            .from("profiles")
            .select("id, username")
            .ilike(
                "username",
                username
            )
            .maybeSingle();

        if (
            !error &&
            profile &&
            profile.id !== mentionedByUserId &&
            String(profile.username).toLowerCase() ===
                username
        ) {
            mentionedUsers.push(
                profile
            );
        }
    }

    if (mentionedUsers.length === 0) {
        return;
    }

    const mentionRows =
        mentionedUsers.map(
            function (profile) {
                return {
                    story_id:
                        storyId,

                    mentioned_user_id:
                        profile.id,

                    mentioned_by_user_id:
                        mentionedByUserId
                };
            }
        );

    const {
        error: mentionError
    } = await supabaseClient
        .from("story_mentions")
        .upsert(
            mentionRows,
            {
                onConflict:
                    "story_id,mentioned_user_id",

                ignoreDuplicates:
                    true
            }
        );

    if (mentionError) {
        console.error(
            "Story mentions save error:",
            mentionError
        );

        return;
    }

    const actorUsername =
        await getUsername(
            mentionedByUserId
        );

    const notificationRows =
        mentionedUsers.map(
            function (profile) {
                return {
                    user_id:
                        profile.id,

                    actor_id:
                        mentionedByUserId,

                    type:
                        "story_mention",

                    story_id:
                     storyId,

                    is_read:
                        false,

                    message:
                        "@" +
                        actorUsername +
                        " mentioned you in their story"
                };
            }
        );

    const {
        data: existingNotifications,
        error: existingNotificationsError
    } = await supabaseClient
        .from("notifications")
        .select("user_id")
        .eq(
            "type",
            "story_mention"
        )
        .eq(
            "post_id",
            storyId
        )
        .in(
            "user_id",
            mentionedUsers.map(
                function (profile) {
                    return profile.id;
                }
            )
        );

    const existingNotificationUsers =
        existingNotificationsError
            ? new Set()
            : new Set(
                (existingNotifications || [])
                    .map(
                        function (item) {
                            return item.user_id;
                        }
                    )
            );

    const notificationRowsToInsert =
        notificationRows.filter(
            function (row) {
                return !existingNotificationUsers.has(
                    row.user_id
                );
            }
        );

    const {
        data: notificationData,
        error: notificationError
    } = await supabaseClient
        .from("notifications")
        .insert(
            notificationRowsToInsert
        );

    console.log(
        "STORY MENTION NOTIFICATION DATA:",
        notificationData
    );

    console.log(
        "STORY MENTION NOTIFICATION ERROR:",
        notificationError
    );

    console.log(
        "STORY MENTION NOTIFICATION ERROR MESSAGE:",
        notificationError?.message
    );

    console.log(
        "STORY MENTION NOTIFICATION ERROR CODE:",
        notificationError?.code
    );

    console.log(
        "STORY MENTION NOTIFICATION ERROR DETAILS:",
        notificationError?.details
    );

    console.log(
        "STORY MENTION NOTIFICATION ERROR HINT:",
        notificationError?.hint
    );

    if (notificationError) {
        console.error(
            "Story mention notification error:",
            notificationError
        );
    }
}

function renderStory() {

    const story =
        activeStories[activeStoryIndex];

    if (
        !story ||
        !storyViewerMedia ||
        !storyViewerProgress
    ) {
        return;
    }

    recordStoryView(story);
    updateStoryViewsButton(story);
    updateStoryLikeButton(story);

    const currentVideo =
        storyViewerMedia.querySelector(
            "video"
        );

    if (currentVideo) {
        currentVideo.pause();
    }

    storyViewerMedia.innerHTML =
        "";

    if (story.media_type === "video") {
        const video =
            document.createElement("video");

        video.src =
            story.media_url;

        video.controls =
            true;

        video.playsInline =
            true;

        video.preload =
            "metadata";

        storyViewerMedia.appendChild(
            video
        );

    } else {

        const image =
            document.createElement("img");

        image.src =
            story.media_url;

        image.alt =
            "Your story";

        storyViewerMedia.appendChild(
            image
        );
    }

    storyViewerProgress.textContent =
        (activeStoryIndex + 1) +
        " / " +
        activeStories.length;

    if (addStoryFromViewer) {
        addStoryFromViewer.hidden =
            !canAddCurrentStory;
    }

    if (previousStoryButton) {
        previousStoryButton.disabled =
            activeStoryIndex === 0;
    }
}

function openStoryViewer(
    stories,
    options = {}
) {

    activeStories =
        stories;

    canAddCurrentStory =
        options.allowStoryAdd === true;

    activeStoryIndex =
        0;

    if (storyViewerModal) {
        storyViewerModal.style.display =
            "flex";
    }

    renderStory();
}

async function loadYourStoriesForViewer() {

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session) {
        return [];
    }

    const {
        data: stories,
        error
    } = await supabaseClient
        .from("stories")
        .select(
            "id, user_id, media_url, media_type, created_at, expires_at"
        )
        .eq(
            "user_id",
            session.user.id
        )
        .gt(
            "expires_at",
            new Date().toISOString()
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {
        console.error(
            "Story loading error:",
            error
        );

        return [];
    }

    return stories || [];
}

async function loadMentionedStoryFromLink() {

    console.log("STORY LINK FUNCTION START");

    const params =
        new URLSearchParams(
            window.location.search
        );

    const storyId =
        params.get("story_id");

    const isMention =
        params.get("mention") === "1";

    const isLike =
        params.get("like") === "1";

    console.log(
        "STORY LINK URL:",
        window.location.href
    );

    console.log(
        "STORY LINK ID:",
        storyId
    );

    console.log(
        "STORY LINK LIKE:",
        isLike
    );

    console.log(
        "STORY LINK MENTION:",
        isMention
    );

    if (
        !storyId ||
        (!isMention && !isLike)
    ) {
        console.log(
            "STORY LINK: INVALID LINK"
        );
        return;
    }

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    console.log(
        "STORY LINK SESSION:",
        session
    );

    if (!session) {
        console.log(
            "STORY LINK: NO SESSION"
        );
        return;
    }

    if (isMention) {
        const {
            data: mention,
            error: mentionError
        } = await supabaseClient
            .from("story_mentions")
            .select("id")
            .eq(
                "story_id",
                storyId
            )
            .eq(
                "mentioned_user_id",
                session.user.id
            )
            .maybeSingle();

        console.log(
            "STORY LINK MENTION DATA:",
            mention
        );

        console.log(
            "STORY LINK MENTION ERROR:",
            mentionError
        );

        if (
            mentionError ||
            !mention
        ) {
            console.log(
                "STORY LINK: MENTION CHECK FAILED"
            );
            return;
        }
    }

    console.log(
        "STORY LINK: PASSED CHECK"
    );

    const {
        data: story,
        error: storyError
    } = await supabaseClient
        .from("stories")
        .select(
            "id, user_id, media_url, media_type, created_at, expires_at"
        )
        .eq(
            "id",
            storyId
        )
        .gt(
            "expires_at",
            new Date().toISOString()
        )
        .maybeSingle();

    console.log(
        "STORY LINK STORY DATA:",
        story
    );

    console.log(
        "STORY LINK STORY ERROR:",
        storyError
    );

    if (
        storyError ||
        !story
    ) {
        console.log(
            "STORY LINK: STORY NOT FOUND OR EXPIRED"
        );
        return;
    }

    console.log(
        "STORY LINK: OPENING STORY VIEWER"
    );

    openStoryViewer(
        [story],
        {
            allowStoryAdd:
                isMention
        }
    );
}

async function addMentionedStoryToMine(story) {

    if (
        !story ||
        !story.id
    ) {
        return;
    }

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session) {
        return;
    }

    const {
        error: storyError
    } = await supabaseClient
        .from("stories")
        .insert({
            user_id:
                session.user.id,

            media_url:
                story.media_url,

            media_type:
                story.media_type,

            expires_at:
                new Date(
                    Date.now() +
                    24 * 60 * 60 * 1000
                ).toISOString()
        });

    if (storyError) {
        alert(
            "Unable to add this Story."
        );

        console.error(
            "Add mentioned Story error:",
            storyError
        );

        return;
    }

    await loadYourStoryState();
    await loadFollowedStories();
    closeStoryViewer();
}

async function loadFollowedStories() {

    if (!storyRow) {
        return;
    }

    storyRow
        .querySelectorAll(
            ".story:not(#yourStory)"
        )
        .forEach(
            function (item) {
                item.remove();
            }
        );

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session) {
        return;
    }

    const {
        data: follows,
        error: followsError
    } = await supabaseClient
        .from("follows")
        .select("following_id")
        .eq(
            "follower_id",
            session.user.id
        );

    if (followsError) {
        console.error(
            "Followed stories error:",
            followsError
        );

        return;
    }

    const userIds = [
        session.user.id,
        ...(follows || []).map(
            function (follow) {
                return follow.following_id;
            }
        )
    ];

    const uniqueUserIds = [
        ...new Set(
            userIds.filter(Boolean)
        )
    ];

    const {
        data: stories,
        error: storiesError
    } = await supabaseClient
        .from("stories")
        .select(
            "id, user_id, media_url, media_type, created_at, expires_at"
        )
        .in(
            "user_id",
            uniqueUserIds
        )
        .gt(
            "expires_at",
            new Date().toISOString()
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (storiesError) {
        console.error(
            "Followed stories load error:",
            storiesError
        );

        return;
    }

    const followedStories =
        (stories || []).filter(
            function (story) {
                return story.user_id !==
                    session.user.id;
            }
        );

    const ownerIds = [
        ...new Set(
            followedStories.map(
                function (story) {
                    return story.user_id;
                }
            )
        )
    ];

    if (ownerIds.length === 0) {
        return;
    }

    const {
        data: profiles,
        error: profilesError
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username, name, avatar_idx"
        )
        .in(
            "id",
            ownerIds
        );

    if (profilesError) {
        console.error(
            "Story profiles error:",
            profilesError
        );

        return;
    }

    const profileMap = {};

    (profiles || []).forEach(
        function (profile) {
            profileMap[profile.id] =
                profile;
        }
    );

    ownerIds.forEach(
        function (ownerId) {

            const profile =
                profileMap[ownerId];

            const ownerStories =
                followedStories.filter(
                    function (story) {
                        return story.user_id ===
                            ownerId;
                    }
                );

            if (!profile || ownerStories.length === 0) {
                return;
            }

            const storyItem =
                document.createElement("div");

            storyItem.className =
                "story friend-story has-active-story";

            const avatar =
                document.createElement("div");

            avatar.className =
                "story-avatar";

            const avatarUrl =
                typeof profile.avatar_idx ===
                    "string" &&
                /^https?:\/\//.test(
                    profile.avatar_idx
                )
                    ? profile.avatar_idx
                    : "";

            if (avatarUrl) {

                const image =
                    document.createElement("img");

                image.className =
                    "story-avatar-image";

                image.src =
                    avatarUrl;

                image.alt =
                    profile.username ||
                    "Story avatar";

                avatar.appendChild(
                    image
                );

            } else {

                avatar.textContent =
                    (
                        profile.name ||
                        profile.username ||
                        "U"
                    )
                        .charAt(0)
                        .toUpperCase();
            }

            const label =
                document.createElement("span");

            label.textContent =
                profile.username ||
                profile.name ||
                "User";

            storyItem.appendChild(
                avatar
            );

            storyItem.appendChild(
                label
            );

            storyItem.onclick =
                function () {
                    openStoryViewer(
                        ownerStories
                    );
                };

            storyRow.appendChild(
                storyItem
            );
        }
    );
}

async function loadYourStoryState() {

    if (!yourStory) {
        return;
    }

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session) {
        return;
    }

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(
            "name, username, avatar_idx"
        )
        .eq(
            "id",
            session.user.id
        )
        .maybeSingle();

    if (
        !profileError &&
        yourStoryAvatar
    ) {

        const avatarText =
            (
                profile?.name ||
                profile?.username ||
                "U"
            )
                .charAt(0)
                .toUpperCase();

        const addButton =
            yourStoryAvatar.querySelector(
                ".add-story"
            );

        const avatarUrl =
            typeof profile?.avatar_idx ===
                "string" &&
            /^https?:\/\//.test(
                profile.avatar_idx
            )
                ? profile.avatar_idx
                : "";

        yourStoryAvatar.classList.toggle(
            "has-profile-picture",
            Boolean(avatarUrl)
        );

        yourStoryAvatar.textContent =
            avatarUrl
                ? ""
                : avatarText;

        if (avatarUrl) {

            const avatarImage =
                document.createElement("img");

            avatarImage.className =
                "story-avatar-image";

            avatarImage.src =
                avatarUrl;

            avatarImage.alt =
                "Your profile picture";

            yourStoryAvatar.appendChild(
                avatarImage
            );

            yourStoryAvatar.classList.add(
                "has-profile-picture"
            );
        }

        if (addButton) {
            yourStoryAvatar.appendChild(
                addButton
            );
        }
    }

    const {
        data: activeStories,
        error
    } = await supabaseClient
        .from("stories")
        .select("id")
        .eq(
            "user_id",
            session.user.id
        )
        .gt(
            "expires_at",
            new Date().toISOString()
        )
        .limit(1);

    if (error) {
        console.error(
            "Story state error:",
            error
        );

        return;
    }

    yourStory.classList.toggle(
        "has-active-story",
        Boolean(
            activeStories &&
            activeStories.length > 0
        )
    );
}

async function uploadStoryFile(file, mediaType) {

    const allowedTypes =
        mediaType === "image"
            ? [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ]
            : [
                "video/mp4",
                "video/webm",
                "video/quicktime"
            ];

    if (!file || !allowedTypes.includes(file.type)) {
        setStoryUploadStatus(
            "Please choose a supported file."
        );

        return;
    }

    const maxFileSize =
        50 * 1024 * 1024;

    if (file.size > maxFileSize) {
        setStoryUploadStatus(
            "File must be 50 MB or smaller."
        );

        return;
    }

    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();

    if (!session) {
        setStoryUploadStatus(
            "Please login first."
        );

        return;
    }

    storyPictureBtn.disabled =
        true;

    storyVideoBtn.disabled =
        true;

    cancelStoryUpload.disabled =
        true;

    setStoryUploadStatus(
        "Uploading story..."
    );

    const fileExtension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const fileName =
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2) +
        "." +
        fileExtension;

    const filePath =
        session.user.id +
        "/" +
        fileName;

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("stories")
        .upload(
            filePath,
            file
        );

    if (uploadError) {
        console.error(
            "Story upload error:",
            uploadError
        );

        setStoryUploadStatus(
            "Story upload failed."
        );

        storyPictureBtn.disabled =
            false;

        storyVideoBtn.disabled =
            false;

        cancelStoryUpload.disabled =
            false;

        return;
    }

    const {
        data: publicUrlData
    } = supabaseClient
        .storage
        .from("stories")
        .getPublicUrl(
            filePath
        );

    const expiresAt =
        new Date(
            Date.now() +
            24 * 60 * 60 * 1000
        ).toISOString();

    const {
        data: insertedStory,
        error: storyError
    } = await supabaseClient
        .from("stories")
        .insert({
            user_id:
                session.user.id,

            media_url:
                publicUrlData.publicUrl,

            media_type:
                mediaType,

            expires_at:
                expiresAt
        })
        .select("id")
        .single();

    if (storyError) {
        console.error(
            "Story save error:",
            storyError
        );

        setStoryUploadStatus(
            "Story could not be saved."
        );

        storyPictureBtn.disabled =
            false;

        storyVideoBtn.disabled =
            false;

        cancelStoryUpload.disabled =
            false;

        return;
    }

    if (
        storyMentionInput &&
        storyMentionInput.value.trim()
    ) {
        await saveStoryMentions(
            insertedStory.id,
            session.user.id,
            storyMentionInput.value
        );
    }

    await loadYourStoryState();
    await loadFollowedStories();
    closeStoryUpload();
}

if (yourStory) {

    yourStory.onclick =
        async function () {

            const stories =
                await loadYourStoriesForViewer();

            if (stories.length > 0) {
                openStoryViewer(
                    stories,
                    {
                        allowStoryAdd:
                            true
                    }
                );
            } else {
                openStoryUploadChooser();
            }
        };
}

if (closeStoryViewerButton) {
    closeStoryViewerButton.onclick =
        closeStoryViewer;
}

if (previousStoryButton) {
    previousStoryButton.onclick =
        function () {

            if (activeStoryIndex > 0) {
                activeStoryIndex -= 1;
                renderStory();
            }
        };
}

if (nextStoryButton) {
    nextStoryButton.onclick =
        function () {

            if (
                activeStoryIndex <
                activeStories.length - 1
            ) {
                activeStoryIndex += 1;
                renderStory();
            } else {
                closeStoryViewer();
            }
        };
}

if (addStoryFromViewer) {
    addStoryFromViewer.onclick =
        async function () {

            if (!canAddCurrentStory) {
                return;
            }

            const {
                data: { session }
            } = await supabaseClient
                .auth
                .getSession();

            const currentStory =
                activeStories[activeStoryIndex];

            if (
                session &&
                currentStory &&
                currentStory.user_id ===
                    session.user.id
            ) {
                closeStoryViewer();
                openStoryUploadChooser();
                return;
            }

            await addMentionedStoryToMine(
                currentStory
            );
        };
}

    if (storyViewsButton) {

        storyViewsButton.onclick =
            async function () {

                await openStoryViewers(
                    storyViewsButton.getAttribute(
                        "data-story-id"
                    )
                );
            };
    }

    if (storyLikeButton) {

    storyLikeButton.onclick =
        async function () {

            storyLikeButton.disabled = true;

            const {
                data: { session }
            } = await supabaseClient
                .auth
                .getSession();

            if (!session) {
                storyLikeButton.disabled = false;
                return;
            }

            const storyId =
                storyLikeButton.getAttribute(
                    "data-story-id"
                );

            if (!storyId) {
                storyLikeButton.disabled = false;
                return;
            }

            const isLiked =
                storyLikeButton.textContent.trim() === "♥";

            if (isLiked) {

                // UNLIKE
                const { error } =
                    await supabaseClient
                        .from("story_likes")
                        .delete()
                        .eq(
                            "story_id",
                            storyId
                        )
                        .eq(
                            "user_id",
                            session.user.id
                        );

                if (error) {
                    console.error(
                        "Story unlike error:",
                        error
                    );
                    alert(
                        "Unlike failed: " +
                        error.message
                    );
                } else {
                    storyLikeButton.textContent = "♡";
                    storyLikeButton.classList.remove("liked");
                }

            } else {

                // LIKE
                const { error } =
                    await supabaseClient
                        .from("story_likes")
                        .insert({
                            story_id:
                                storyId,
                            user_id:
                                session.user.id
                        });

                if (error) {
                    console.error(
                        "Story like error:",
                        error
                    );
                    alert(
                        "Like failed: " +
                        error.message
                    );
                } else {
                    storyLikeButton.textContent = "♥";
                    storyLikeButton.classList.add("liked");
                }
            }

            storyLikeButton.disabled = false;
        };
}

    if (closeStoryViewersButton) {
        closeStoryViewersButton.onclick =
            closeStoryViewers;
    }

    if (storyViewersModal) {
        storyViewersModal.onclick =
            function (event) {

                if (
                    event.target ===
                    storyViewersModal
                ) {
                    closeStoryViewers();
                }
            };
    }

if (storyPictureBtn && storyFileInput) {

    storyPictureBtn.onclick =
        function () {

            storyFileInput.accept =
                "image/jpeg,image/png,image/webp,image/gif";

            storyFileInput.dataset.mediaType =
                "image";

            storyFileInput.click();
        };
}

if (storyVideoBtn && storyFileInput) {

    storyVideoBtn.onclick =
        function () {

            storyFileInput.accept =
                "video/mp4,video/webm,video/quicktime";

            storyFileInput.dataset.mediaType =
                "video";

            storyFileInput.click();
        };
}

if (storyFileInput) {

    storyFileInput.onchange =
        async function () {

            await uploadStoryFile(
                storyFileInput.files[0],
                storyFileInput.dataset.mediaType
            );
        };
}

    if (storyMentionInput) {

        storyMentionInput.addEventListener(
            "input",
            async function () {

                const value =
                    storyMentionInput.value;

                const cursorPosition =
                    storyMentionInput.selectionStart ||
                    value.length;

                const beforeCursor =
                    value.slice(
                        0,
                        cursorPosition
                    );

                const match =
                    beforeCursor.match(
                        /(?:^|\s)@([a-zA-Z0-9_.]*)$/
                    );

                if (!match) {
                    hideStoryMentionSuggestions();
                    return;
                }

                await loadStoryMentionSuggestions(
                    match[1]
                );
            }
        );

        storyMentionInput.addEventListener(
            "blur",
            function () {
                setTimeout(
                    hideStoryMentionSuggestions,
                    150
                );
            }
        );
    }

if (cancelStoryUpload) {
    cancelStoryUpload.onclick =
        closeStoryUpload;
}

if (storyUploadModal) {
    storyUploadModal.onclick =
        function (event) {

            if (
                event.target ===
                storyUploadModal
            ) {
                closeStoryUpload();
            }
        };
}

loadYourStoryState();
loadFollowedStories();
loadMentionedStoryFromLink();


// =========================
// GET USERNAME
// =========================

async function getUsername(
    userId
) {

    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq(
            "id",
            userId
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Username load error:",
            error
        );

        return "inware_user";
    }


    return (
        profile?.username ||
        "inware_user"
    );
}


// =========================
// LOAD POSTS
// =========================

async function loadPosts() {

    const feed =
        document.getElementById(
            "feed"
        );

    if (!feed) {
        return;
    }


    const {
        data: posts,
        error
    } = await supabaseClient
        .from("posts")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Posts load error:",
            error
        );

        return;
    }


    feed.innerHTML =
        "";


    if (
        !posts ||
        posts.length === 0
    ) {

        feed.innerHTML = `
            <div class="empty-message">
                No posts yet 📸
            </div>
        `;

        return;
    }


    // =========================
    // EACH POST
    // =========================

    for (const post of posts) {

        const username =
            await getUsername(
                post.user_id
            );


        const article =
            document.createElement(
                "article"
            );


        article.className =
            "post";


        // EXACT OLD STRUCTURE
        article.innerHTML = `

            <div class="post-header">

                <div class="user-info">

                    <div class="post-avatar">
                        ${username
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>

                        <strong>
                            ${username}
                        </strong>

                        <small>
                            India
                        </small>

                    </div>

                </div>

                <button class="more-btn">
                    ⋯
                </button>

            </div>


            ${
    post.media_type === "video"
    ?
    `
    <div class="post-image post-video">

        <video
            src="${post.image_url}"
            controls
            playsinline
            preload="metadata"
            style="width:100%; max-height:600px; display:block;"
        ></video>

    </div>
    `
    :
    post.image_url
    ?
    `
    <div class="post-image">

        <img
            src="${post.image_url}"
            alt="Post"
        >

    </div>
    `
    :
    `
    <div class="post-image">

        <div class="demo-image">
            inware
        </div>

    </div>
    `
}


            <div class="post-actions">

                <div class="left-actions">

                    <button
                        class="action-btn like-btn"
                        type="button"
                    >
                        ♡
                    </button>


                    <button
                        class="action-btn comment-btn"
                        type="button"
                    >
                        💬
                    </button>


                    <button
                        class="action-btn share-btn"
                        type="button"
                    >
                        ➤
                    </button>

                </div>


                <button
                    class="action-btn save-btn"
                    type="button"
                >
                    ♡
                </button>

            </div>


            <div class="post-content">

                <strong class="likes-count">
                    0 likes
                </strong>


                <p>

                    <b>
                        ${username}
                    </b>

                    ${post.caption || ""}

                </p>


                <button
                    class="comments-link"
                    type="button"
                    data-post-id="${post.id}"
                >
                    View all comments
                </button>


                <div class="comments-list"></div>


                <div class="comment-box">

                    <input
                        type="text"
                        class="comment-input"
                        placeholder="Write a comment..."
                    >

                    <button
                        class="comment-submit"
                        type="button"
                        data-post-id="${post.id}"
                    >
                        Post
                    </button>

                </div>

            </div>

        `;


        feed.appendChild(
            article
        );


       // LIKE 
        await setupLikeButton(
            article,
            post.id
        );


        // COMMENTS
        await loadComments(
            article,
            post.id
        );


        // COMMENT BUTTON
        setupCommentButton(
            article
        );


        // SHARE BUTTON
        setupShareButton(
            article,
            post
        );


        // VIEW COMMENTS
        setupCommentsLink(
            article
        );
    }
}


// =========================
// LIKE SYSTEM
// =========================

async function setupLikeButton(
    article,
    postId
) {

    const likeButton =
        article.querySelector(
            ".like-btn"
        );


    const likesCount =
        article.querySelector(
            ".likes-count"
        );


    const {
        data: { session }
    } = await supabaseClient
        .auth
        .getSession();


    if (!session) {
        return;
    }


    const userId =
        session.user.id;


    // TOTAL LIKES
    const {
        count,
        error: countError
    } = await supabaseClient
        .from("likes")
        .select(
            "*",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "post_id",
            postId
        );


    if (!countError) {

        likesCount.textContent =
            (count || 0) +
            " likes";
    }


    // CURRENT USER LIKE
    const {
        data: myLike,
        error: myLikeError
    } = await supabaseClient
        .from("likes")
        .select(
            "user_id, post_id"
        )
        .eq(
            "user_id",
            userId
        )
        .eq(
            "post_id",
            postId
        )
        .maybeSingle();


    if (
        !myLikeError &&
        myLike
    ) {

        likeButton.textContent =
            "♥";

        likeButton.classList.add(
            "liked"
        );

    } else {

        likeButton.textContent =
            "♡";

        likeButton.classList.remove(
            "liked"
        );
    }


    // LIKE / UNLIKE
    likeButton.onclick =
        async function () {

            likeButton.disabled =
                true;


            // UNLIKE
            if (
                likeButton.textContent.trim()
                === "♥"
            ) {

                const {
                    error
                } = await supabaseClient
                    .from("likes")
                    .delete()
                    .eq(
                        "user_id",
                        userId
                    )
                    .eq(
                        "post_id",
                        postId
                    );


                if (error) {

                    console.error(
                        "Unlike error:",
                        error
                    );

                    alert(
                        "Unlike failed: " +
                        error.message
                    );

                } else {

                    likeButton.textContent =
                        "♡";

                    likeButton.classList.remove(
                        "liked"
                    );


                    const currentCount =
                        Number(
                            likesCount
                                .textContent
                                .replace(
                                    " likes",
                                    ""
                                )
                        ) || 0;


                    likesCount.textContent =
                        Math.max(
                            0,
                            currentCount - 1
                        ) +
                        " likes";
                }


            }

            // LIKE
            else {

                const {
                    error
                } = await supabaseClient
                    .from("likes")
                    .insert({

                        user_id:
                            userId,

                        post_id:
                            postId
                    });


                if (error) {

                    console.error(
                        "Like error:",
                        error
                    );

                    alert(
                        "Like failed: " +
                        error.message
                    );

                } else {

                    likeButton.textContent =
                        "♥";

                    likeButton.classList.add(
                        "liked"
                    );


                    const currentCount =
                        Number(
                            likesCount
                                .textContent
                                .replace(
                                    " likes",
                                    ""
                                )
                        ) || 0;


                    likesCount.textContent =
                        (
                            currentCount + 1
                        ) +
                        " likes";
                }
            }


            likeButton.disabled =
                false;
        };
}


// =========================
// COMMENT BUTTON
// =========================

function setupCommentButton(
    article
) {

    const commentButton =
        article.querySelector(
            ".comment-btn"
        );


    const commentBox =
        article.querySelector(
            ".comment-box"
        );


    if (
        !commentButton ||
        !commentBox
    ) {
        return;
    }


    commentButton.onclick =
        function () {

            commentBox.style.display =
                commentBox.style.display ===
                "flex"
                    ? "none"
                    : "flex";


            const input =
                commentBox.querySelector(
                    ".comment-input"
                );


            if (input) {
                input.focus();
            }
        };
}


// =========================
// SAVE COMMENT
// =========================

document.addEventListener(
    "click",
    async function (event) {

        if (
            !event.target.classList.contains(
                "comment-submit"
            )
        ) {
            return;
        }


        const button =
            event.target;


        const postId =
            button.getAttribute(
                "data-post-id"
            );


        const commentBox =
            button.closest(
                ".comment-box"
            );


        const input =
            commentBox.querySelector(
                ".comment-input"
            );


        const comment =
            input.value.trim();


        if (!comment) {

            alert(
                "Please write a comment."
            );

            return;
        }


        const {
            data: { session }
        } = await supabaseClient
            .auth
            .getSession();


        if (!session) {

            alert(
                "Please login first."
            );

            return;
        }


        button.disabled =
            true;


        const {
            error
        } = await supabaseClient
            .from("comments")
            .insert({

                user_id:
                    session.user.id,

                post_id:
                    postId,

                comment:
                    comment
            });


        if (error) {

            console.error(
                "Comment error:",
                error
            );

            alert(
                "Comment failed: " +
                error.message
            );

            button.disabled =
                false;

            return;
        }


        input.value =
            "";


        button.disabled =
            false;


        const postArticle =
            button.closest(".post") ||
            activeHomeCommentsArticle;

        if (postArticle) {

            await loadComments(
                postArticle,
                postId
            );

            if (
                homeCommentsModal &&
                homeCommentsModal.style.display !==
                    "none" &&
                homeCommentsList
            ) {
                await loadComments(
                    postArticle,
                    postId,
                    true,
                    homeCommentsList
                );
            }
        }
    }
);


// =========================
// LOAD COMMENTS
// =========================

async function loadComments(
    article,
    postId,
    showAll = false,
    targetCommentsList = null
) {

    const commentsList =
        targetCommentsList ||
        article.querySelector(
            ".comments-list"
        );

    const commentsLink =
        article.querySelector(
            ".comments-link"
        );


    if (!commentsList) {
        return;
    }


    const {
        data: comments,
        error
    } = await supabaseClient
        .from("comments")
        .select(`
            comment,
            created_at,
            user_id
        `)
        .eq(
            "post_id",
            postId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Load comments error:",
            error
        );

        return;
    }


    commentsList.innerHTML =
        "";


    if (
        !comments ||
        comments.length === 0
    ) {

        if (
            commentsLink &&
            !targetCommentsList
        ) {
            commentsLink.style.display =
                "none";
        }

        return;
    }

    if (
        commentsLink &&
        !targetCommentsList
    ) {

        commentsLink.style.display =
            comments.length > 2 && !showAll
                ? "inline-block"
                : "none";
    }

    const commentsToShow =
        showAll
            ? comments
            : comments.slice(0, 2);

    for (
        const item of commentsToShow
    ) {
        const username =
            await getUsername(
                item.user_id
            );


        const commentDiv =
            document.createElement(
                "div"
            );


        commentDiv.className =
            "single-comment";


        commentDiv.innerHTML = `

            <strong>
                ${username}
            </strong>

            <span>
                ${item.comment}
            </span>

        `;


        commentsList.appendChild(
            commentDiv
        );
    }
}


// =========================
// VIEW ALL COMMENTS
// =========================

function setupCommentsLink(
    article
) {

    const button =
        article.querySelector(
            ".comments-link"
        );


    const commentsList =
        article.querySelector(
            ".comments-list"
        );


    if (
        !button ||
        !commentsList
    ) {
        return;
    }


    button.onclick =
        async function () {

            if (
                !homeCommentsModal ||
                !homeCommentsList
            ) {
                return;
            }

            activeHomeCommentsArticle =
                article;

            const modalSubmit =
                homeCommentsModal.querySelector(
                    ".comment-submit"
                );

            if (modalSubmit) {
                modalSubmit.setAttribute(
                    "data-post-id",
                    button.dataset.postId
                );
            }

            await loadComments(
                article,
                button.dataset.postId,
                true,
                homeCommentsList
            );

            homeCommentsModal.style.display =
                "flex";
        };
}

if (closeHomeComments) {

    closeHomeComments.onclick =
        function () {

            homeCommentsModal.style.display =
                "none";

            activeHomeCommentsArticle =
                null;
        };
}

if (homeCommentsModal) {

    homeCommentsModal.onclick =
        function (event) {

            if (
                event.target ===
                homeCommentsModal
            ) {
                homeCommentsModal.style.display =
                    "none";

                activeHomeCommentsArticle =
                    null;
            }
        };
}


// =========================
// SHARE BUTTON
// =========================

function setupShareButton(
    article,
    post
) {

    const shareButton =
        article.querySelector(
            ".share-btn"
        );


    if (!shareButton) {
        return;
    }


    shareButton.onclick =
        async function () {

            const shareData = {

                title:
                    "inware",

                text:
                    post.caption ||
                    "Check this post on inware",

                url:
                    window.location.href
            };


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share(
                        shareData
                    );

                } else {

                    await navigator.clipboard
                        .writeText(
                            window.location.href
                        );


                    alert(
                        "Post link copied! 🔗"
                    );
                }

            } catch (error) {

                console.log(
                    "Share cancelled"
                );
            }
        };
}


// =========================
// START APP
// =========================

checkLogin();

loadPosts();

// =========================
// REELS NAVIGATION
// =========================

const reelsNav =
    document.getElementById("reelsNav");

if (reelsNav) {

    reelsNav.onclick = function () {

        window.location.href =
            "reels.html";

    };

}