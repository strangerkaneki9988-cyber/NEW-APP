// =========================
// SUPABASE
// =========================

const SUPABASE_URL =
    "https://iwsaqcopxhqizduvutdh.supabase.co";

const SUPABASE_KEY =
     "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================
// ELEMENTS
// =========================

const reelsFeed =
    document.getElementById("reelsFeed");

const backBtn =
    document.getElementById("backBtn");


// =========================
// BACK BUTTON
// =========================

if (backBtn) {

    backBtn.onclick = function () {

        window.location.href =
            "home.html";

    };

}


// =========================
// LOAD REELS
// =========================

async function loadReels() {

    if (!reelsFeed) {
        return;
    }

    reelsFeed.innerHTML =
        `
        <div class="reels-loading">
            Loading Reels...
        </div>
        `;


    // =========================
    // GET VIDEO POSTS
    // =========================

    const {
        data: reels,
        error
    } = await supabaseClient
        .from("posts")
        .select(`
            id,
            user_id,
            image_url,
            caption,
            created_at,
            media_type,
            video_duration,
            profiles (
                username
            )
        `)
        .eq("media_type", "video")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Reels loading error:",
            error
        );

        reelsFeed.innerHTML =
            `
            <div class="reels-empty">
                Unable to load Reels.
            </div>
            `;

        return;
    }


    // =========================
    // NO REELS
    // =========================

    if (
        !reels ||
        reels.length === 0
    ) {

        reelsFeed.innerHTML =
            `
            <div class="reels-empty">
                🎥<br><br>
                No Reels available yet.
            </div>
            `;

        return;
    }


    // =========================
    // CREATE REELS
    // =========================

    reelsFeed.innerHTML = "";


    for (const reel of reels) {

        const username =
            reel.profiles &&
            reel.profiles.username
                ? reel.profiles.username
                : "User";


        const reelItem =
            document.createElement("article");

        reelItem.className =
            "reel-item";

        reelItem.dataset.postId =
            reel.id;


        reelItem.innerHTML =
            `
            <video
                class="reel-video"
                src="${reel.image_url}"
                playsinline
                loop
                preload="metadata"
            ></video>

            <div class="reel-info">

                <div class="reel-username">
                    @${username}
                </div>

                <div class="reel-caption">
                    ${reel.caption || ""}
                </div>

            </div>

            <div class="reel-actions">

               <button
    class="reel-action-btn like-btn"
    title="Like"
>
    ♡
</button>

<div class="reel-likes-count">
    0 likes
</div>

<div class="reel-views-count">
    👁️ 0
</div>

                <button
                    class="reel-action-btn comment-btn"
                    title="Comment"
                >
                    💬
                </button>

                <button
                    class="reel-action-btn share-btn"
                    title="Share"
                >
                    ↗️
                </button>

            </div>
            `;


        reelsFeed.appendChild(
            reelItem
        );
              
        await setupReelLikeButton(
    reelItem,
    reel.id
);

await setupReelCommentButton(
    reelItem,
    reel.id
);        

        updateReelViewCount(
            reelItem,
            reel.id
        );

    }

    setupReelShare();
    setupReelSound();
    setupReelAutoplay();

    const targetPostId =
        new URLSearchParams(
            window.location.search
        ).get("post_id");

    if (targetPostId) {

        const targetReel =
            reelsFeed.querySelector(
                '[data-post-id="' +
                targetPostId.replace(
                    /"/g,
                    "&quot;"
                ) +
                '"]'
            );

        if (targetReel) {

            targetReel.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            await openReelComments(
                targetReel,
                targetPostId
            );

        }

    }


// =========================
// REEL SHARE
// =========================

function setupReelShare() {

    const shareButtons =
        document.querySelectorAll(".share-btn");

    shareButtons.forEach(function (button) {

        button.onclick =
            async function (event) {

                event.stopPropagation();

                const reelItem =
                    button.closest(".reel-item");

                if (!reelItem) {
                    return;
                }

                const postId =
                    reelItem.dataset.postId;

                if (!postId) {
                    return;
                }

                const shareUrl =
                    new URL(
                        "reels.html",
                        window.location.href
                    );

                shareUrl.searchParams.set(
                    "post_id",
                    postId
                );

                const shareUrlText =
                    shareUrl.href;

                try {

                    if (
                        typeof navigator.share ===
                        "function"
                    ) {

                        await navigator.share({
                            title: "inware Reel",
                            text: "Check out this Reel on inware!",
                            url: shareUrlText
                        });

                    } else {

                        await copyReelLink(
                            shareUrlText
                        );

                        alert(
                            "Reel link copied! 🔗"
                        );

                    }

                } catch (error) {

                    if (
                        error.name ===
                        "AbortError"
                    ) {
                        return;
                    }

                    alert(
                        "Unable to share this Reel."
                    );

                }

            };

    });

}

async function copyReelLink(shareUrl) {

    if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText ===
        "function"
    ) {
        await navigator.clipboard.writeText(
            shareUrl
        );

        return;
    }

    const textArea =
        document.createElement("textarea");

    textArea.value =
        shareUrl;

    textArea.setAttribute(
        "readonly",
        ""
    );

    textArea.style.position =
        "fixed";

    textArea.style.opacity =
        "0";

    document.body.appendChild(
        textArea
    );

    textArea.select();

    const copied =
        document.execCommand("copy");

    textArea.remove();

    if (!copied) {
        throw new Error(
            "Clipboard unavailable"
        );
    }

}

  }

// =========================
// MUTE / UNMUTE
// =========================

function setupReelSound() {

    const videos =
        document.querySelectorAll(".reel-video");

    videos.forEach(function (video) {

        const soundButton =
            document.createElement("button");

        soundButton.className =
            "reel-sound-btn";

        soundButton.innerHTML = "🔇";

        soundButton.title =
            "Sound";

        soundButton.onclick =
            function (event) {

                event.stopPropagation();

                video.muted =
                    !video.muted;

                soundButton.innerHTML =
                    video.muted
                        ? "🔇"
                        : "🔊";
            };

        video.parentElement.appendChild(
            soundButton
        );

    });

}

async function updateReelViewCount(reelItem, postId) {

    const viewsCount =
        reelItem.querySelector(
            ".reel-views-count"
        );

    if (!viewsCount) {
        return;
    }

    const {
        count,
        error
    } = await supabaseClient
        .from("reel_views")
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

    if (!error) {

        viewsCount.textContent =
            "👁️ " +
            (count || 0);

    }

}

async function recordReelView(reelItem, postId) {

    if (
        !reelItem ||
        !postId ||
        reelItem.dataset.viewRecorded === "true"
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

    reelItem.dataset.viewRecorded =
        "true";

    const {
        error
    } = await supabaseClient
        .from("reel_views")
        .upsert(
            {
                post_id:
                    postId,

                user_id:
                    session.user.id
            },
            {
                onConflict:
                    "post_id,user_id",

                ignoreDuplicates:
                    true
            }
        );

    if (error) {

        console.error(
            "Reel view error:",
            error
        );

        reelItem.dataset.viewRecorded =
            "false";

        return;
    }

    await updateReelViewCount(
        reelItem,
        postId
    );

}

// =========================
// AUTOPLAY
// =========================

function setupReelAutoplay() {

    const videos =
        document.querySelectorAll(
            ".reel-video"
        );


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        const video =
                            entry.target;


                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.7
                        ) {

                            videos.forEach(
                                function (otherVideo) {

                                    if (
                                        otherVideo !==
                                        video
                                    ) {

                                        otherVideo.pause();

                                    }

                                }
                            );


                            const reelItem =
                                video.closest(
                                    ".reel-item"
                                );

                            if (reelItem) {

                                recordReelView(
                                    reelItem,
                                    reelItem.dataset.postId
                                );

                            }

                            video.play()
                                .catch(
                                    function () {}
                                );

                        } else {

                            video.pause();

                        }

                    }
                );

            },
            {
                threshold: [0.7]
            }
        );


    videos.forEach(
        function (video) {

            observer.observe(
                video
            );

        }
    );

}


// =========================
// START
// =========================

loadReels();

// =========================
// REEL LIKE SYSTEM
// =========================

async function setupReelLikeButton(
    reelItem,
    postId
) {

    const likeButton =
        reelItem.querySelector(
            ".like-btn"
        );

    const likesCount =
        reelItem.querySelector(
            ".reel-likes-count"
        );

    if (
        !likeButton ||
        !likesCount
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
        data: myLike
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


    if (myLike) {

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
        async function (event) {

            event.stopPropagation();

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


                if (!error) {

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


                if (!error) {

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

async function setupReelCommentButton(reelItem, postId) {

    const commentButton =
        reelItem.querySelector(".comment-btn");

    if (!commentButton) return;

    commentButton.onclick = function (event) {

        event.stopPropagation();

        openReelComments(
            reelItem,
            postId
        );
    };
}

async function loadReelComments(
    postId,
    commentsList,
    reelCommentInput,
    setReplyToCommentId
) {

    const {
        data: comments,
        error
    } = await supabaseClient
        .from("comments")
        .select(`
            id,
            user_id,
            comment,
            created_at,
            parent_id
        `)
        .eq("post_id", postId)
        .order("created_at", {
            ascending: true
        });


    if (error) {

        console.error(
            "Comments load error:",
            error
        );

        commentsList.innerHTML =
            "Unable to load comments.";

        return;
    }


    // =========================
    // PROFILE USERNAMES
    // =========================

    const userIds = [
        ...new Set(
            (comments || [])
                .map(
                    item => item.user_id
                )
                .filter(Boolean)
        )
    ];


    let profileMap = {};


    if (userIds.length > 0) {

        const {
            data: profiles,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select(
                "id, username"
            )
            .in(
                "id",
                userIds
            );


        if (
            !profileError &&
            profiles
        ) {

            profiles.forEach(
                function (profile) {

                    profileMap[
                        profile.id
                    ] =
                        profile.username;

                }
            );

        }

    }


    // =========================
    // NO COMMENTS
    // =========================

    if (
        !comments ||
        comments.length === 0
    ) {

        commentsList.innerHTML = `
            <div style="
                text-align:center;
                color:#888;
                padding:30px;
            ">
                No comments yet.
            </div>
        `;

        return;
    }


    // =========================
    // SEPARATE COMMENTS
    // =========================

    const mainComments =
        comments.filter(
            function (item) {

                return !item.parent_id;

            }
        );


    const replies =
        comments.filter(
            function (item) {

                return !!item.parent_id;

            }
        );


    commentsList.innerHTML =
        "";


    // =========================
    // CREATE MAIN COMMENTS
    // =========================

    mainComments.forEach(
        function (item) {

            const username =
                profileMap[
                    item.user_id
                ] ||
                "User";


            const commentDiv =
                document.createElement(
                    "div"
                );


            commentDiv.className =
                "comment-item";


            commentDiv.innerHTML = `
                <div class="comment-username">
                    @${username}
                </div>

                <div class="comment-text">
                    ${item.comment}
                </div>

                <button
                    class="reply-comment-btn"
                    data-comment-id="${item.id}"
                    data-username="${username}"
                >
                    Reply
                </button>
            `;


            commentsList.appendChild(
                commentDiv
            );


            // =========================
            // REPLIES
            // =========================

            const commentReplies =
                replies.filter(
                    function (reply) {

                        return (
                            reply.parent_id ===
                            item.id
                        );

                    }
                );


            commentReplies.forEach(
                function (reply) {

                    const replyUsername =
                        profileMap[
                            reply.user_id
                        ] ||
                        "User";


                    const replyDiv =
                        document.createElement(
                            "div"
                        );


                    replyDiv.className =
                        "comment-item reply-item";


                    replyDiv.style.marginLeft =
                        "35px";


                    replyDiv.style.borderLeft =
                        "2px solid #ddd";


                    replyDiv.style.paddingLeft =
                        "12px";


                    replyDiv.innerHTML = `
                        <div class="comment-username">
                            @${replyUsername}
                        </div>

                        <div class="comment-text">
                            ${reply.comment}
                        </div>

                        <button
                            class="reply-comment-btn"
                            data-comment-id="${reply.id}"
                            data-username="${replyUsername}"
                        >
                            Reply
                        </button>
                    `;


                    commentsList.appendChild(
                        replyDiv
                    );

                }
            );

        }
    );


    // =========================
    // REPLY BUTTONS
    // =========================

    const replyButtons =
        commentsList.querySelectorAll(
            ".reply-comment-btn"
        );


    replyButtons.forEach(
        function (button) {

            button.onclick =
                function (event) {

                    event.stopPropagation();


                    const username =
                        button.dataset
                            .username;


                    setReplyToCommentId(
                        button.dataset
                            .commentId
                    );


                    if (
                        !reelCommentInput
                    ) {

                        return;

                    }


                    reelCommentInput.value =
                        "@" +
                        username +
                        " ";


                    reelCommentInput.focus();

                };

        }
    );


    // =========================
    // SCROLL
    // =========================

    commentsList.scrollTop =
        commentsList.scrollHeight;

}


async function openReelComments(reelItem, postId) {

    const commentModal =
        document.getElementById("commentModal");

    const commentsList =
        document.getElementById("commentsList");

    const closeComments =
        document.getElementById("closeComments");

    const reelCommentInput =
        document.getElementById("reelCommentInput");

    const sendReelComment =
        document.getElementById("sendReelComment");

    if (
        !commentModal ||
        !commentsList ||
        !reelCommentInput
    ) {
        return;
    }

    let replyToCommentId = null;

    commentModal.style.display =
        "flex";


    // =========================
    // INITIAL LOAD
    // =========================

    await loadReelComments(
        postId,
        commentsList,
        reelCommentInput,
        function (commentId) {

            replyToCommentId =
                commentId;

        }
    );


    // =========================
    // CLOSE BUTTON
    // =========================

    if (closeComments) {

        closeComments.onclick =
            function () {

                commentModal.style.display =
                    "none";

                replyToCommentId =
                    null;

            };

    }


    // =========================
    // CLICK OUTSIDE MODAL
    // =========================

    commentModal.onclick =
        function (event) {

            if (
                event.target ===
                commentModal
            ) {

                commentModal.style.display =
                    "none";

                replyToCommentId =
                    null;

            }

        };


    // =========================
    // SEND COMMENT / REPLY
    // =========================

    if (sendReelComment) {

        sendReelComment.onclick =
            async function () {


                const text =
                    reelCommentInput.value.trim();


                if (!text) {

                    return;
                }


                const {
                    data: {
                        session
                    }
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (!session) {

                    alert(
                        "Please login first."
                    );

                    return;
                }


                sendReelComment.disabled =
                    true;


                // =========================
                // INSERT COMMENT
                // =========================
console.log("REPLY DEBUG:", replyToCommentId);

                const {
                    error
                } =
                    await supabaseClient
                        .from("comments")
                        .insert({

                            post_id:
                                postId,

                            user_id:
                                session.user.id,

                            comment:
                                text,

                            parent_id:
                                replyToCommentId

                        });


                if (error) {

                    console.error(
                        "Comment insert error:",
                        error
                    );


                    alert(
                        "Comment failed: " +
                        error.message
                    );


                    sendReelComment.disabled =
                        false;

                    return;
                }


                // =========================
                // RESET
                // =========================

                reelCommentInput.value =
                    "";

                replyToCommentId =
                    null;


                // =========================
                // RELOAD
                // =========================

                await loadReelComments(
                    postId,
                    commentsList,
                    reelCommentInput,
                    function (commentId) {

                        replyToCommentId =
                            commentId;

                    }
                );


                sendReelComment.disabled =
                    false;

            };
    }
}
