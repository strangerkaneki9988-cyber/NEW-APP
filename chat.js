// =========================
// SUPABASE CONFIG
// =========================

const SUPABASE_URL = "https://iwsaqcopxhqizduvutdh.supabase.co";
const SUPABASE_KEY = "sb_publishable_LUfYdLWIP1Gc83usTvUsFQ_VTjFmF_c";

function renderProfileAvatarImage(element, profile) {
    const avatarUrl = typeof profile?.avatar_idx === "string" && /^https?:\/\//i.test(profile.avatar_idx)
        ? profile.avatar_idx
        : "";
    if (!element || !avatarUrl) return;
    const image = document.createElement("img");
    image.src = avatarUrl;
    image.alt = "";
    element.replaceChildren(image);
}

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ========================= 
// GLOBAL VARIABLES 
// ========================= 
 
let currentUser = null; 
let selectedUser = null; 
let realtimeChannel = null; 
let onlineInterval = null; 
let statusInterval = null; 
let typingCheckInterval = null; 
let selectedGroup = null; 
let groupRealtimeChannel = null;
let chatListFilterRequest = 0;
let pendingGroupName = null;
let groupMemberProfiles = [];

const newChatBtn = 
    document.getElementById("newChatBtn"); 

const addMemberBtn = 
    document.getElementById("addMemberBtn");

const leaveGroupBtn =
    document.getElementById("leaveGroupBtn");

const editGroupBtn =
    document.getElementById("editGroupBtn");

const groupSettingsBtn =
    document.getElementById("groupSettingsBtn");

const inviteGroupBtn =
    document.getElementById("inviteGroupBtn");

const changeGroupAvatarBtn =
    document.getElementById("changeGroupAvatarBtn");

const groupAvatarInput =
    document.getElementById("groupAvatarInput");

const audioCallBtn =
    document.getElementById("audioCallBtn");

const videoCallBtn =
    document.getElementById("videoCallBtn");

const directCallControls =
    document.getElementById("directCallControls");

const callOverlay =
    document.getElementById("callOverlay");

const callAvatar =
    document.getElementById("callAvatar");

const callUsername =
    document.getElementById("callUsername");

const callStatusText =
    document.getElementById("callStatusText");

const callTimer =
    document.getElementById("callTimer");

const remoteVideo =
    document.getElementById("remoteVideo");

const localVideo =
    document.getElementById("localVideo");

const callMuteBtn =
    document.getElementById("callMuteBtn");

const callSpeakerBtn =
    document.getElementById("callSpeakerBtn");

const callCameraBtn =
    document.getElementById("callCameraBtn");

const callSwitchCameraBtn =
    document.getElementById("callSwitchCameraBtn");

const callEndBtn =
    document.getElementById("callEndBtn");

const incomingCallPanel =
    document.getElementById("incomingCallPanel");

const incomingCallAvatar =
    document.getElementById("incomingCallAvatar");

const incomingCallUsername =
    document.getElementById("incomingCallUsername");

const incomingCallType =
    document.getElementById("incomingCallType");

const acceptCallBtn =
    document.getElementById("acceptCallBtn");

const declineCallBtn =
    document.getElementById("declineCallBtn");

const callMinimizeBtn =
    document.getElementById("callMinimizeBtn");

const callIdleState =
    document.getElementById("callIdleState");

let callSignalChannel = null;
let peerConnection = null;
let localCallStream = null;
let remoteCallStream = null;
let activeCallId = null;
let activeCallType = null;
let activeCallPeerId = null;
let activeCallState = "idle";
let callTimerInterval = null;
let callStartTime = null;
let isCallMicMuted = false;
let isCallCameraMuted = false;
let isCallSpeakerEnabled = true;
let pendingIncomingOffer = null;
let pendingIncomingCaller = null;
let hasCameraSupport = false;
let currentFacingMode = "user";

function setDirectCallButtonsVisible(visible) {
    if (directCallControls) {
        directCallControls.hidden = !visible;
    }
}

function showToast(message) {
    if (!message) {
        return;
    }

    const toast = document.getElementById("inwareCallToast");

    if (toast) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 2500);
        return;
    }

    const node = document.createElement("div");
    node.id = "inwareCallToast";
    node.className = "inware-call-toast";
    node.textContent = message;
    document.body.appendChild(node);

    setTimeout(() => {
        node.classList.add("is-visible");
    }, 10);

    setTimeout(() => {
        node.classList.remove("is-visible");
        setTimeout(() => node.remove(), 250);
    }, 2500);
}

function getCallSignalChannelName(userId) {
    return "inware-call-" + userId;
}

function updateCallDisplayState() {
    if (!callOverlay) {
        return;
    }

    const hasRemote = Boolean(remoteVideo && remoteVideo.srcObject);
    const hasLocal = Boolean(localVideo && localVideo.srcObject);

    callOverlay.querySelector(".call-display-area")?.classList.toggle("has-remote-video", hasRemote);
    callOverlay.querySelector(".call-display-area")?.classList.toggle("has-local-video", hasLocal);
}

function setCallStatus(text) {
    if (callStatusText) {
        callStatusText.textContent = text;
    }
}

function startCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
    }

    callStartTime = Date.now();

    callTimerInterval = setInterval(() => {
        if (!callStartTime) {
            return;
        }

        const diffSeconds = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = String(Math.floor(diffSeconds / 60)).padStart(2, "0");
        const seconds = String(diffSeconds % 60).padStart(2, "0");

        if (callTimer) {
            callTimer.textContent = minutes + ":" + seconds;
        }
    }, 1000);
}

function stopCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }

    callStartTime = null;

    if (callTimer) {
        callTimer.textContent = "00:00";
    }
}

function setCallOverlayVisible(visible) {
    if (!callOverlay) {
        return;
    }

    callOverlay.classList.toggle("hidden", !visible);
}

function setCallButtonsForMode(mode) {
    const isVideo = mode === "video";

    if (callCameraBtn) {
        callCameraBtn.style.display = isVideo ? "flex" : "none";
    }

    if (callSwitchCameraBtn) {
        callSwitchCameraBtn.style.display = isVideo ? "flex" : "none";
    }

    if (callOverlay) {
        callOverlay.querySelector(".call-display-area")?.classList.toggle("has-local-video", isVideo);
    }
}

function ensureCallSignalChannel() {
    if (!currentUser || !supabaseClient) {
        return;
    }

    const channelName = getCallSignalChannelName(currentUser.id);

    if (callSignalChannel) {
        if (callSignalChannel.topic === channelName) {
            return;
        }

        supabaseClient.removeChannel(callSignalChannel);
        callSignalChannel = null;
    }

    callSignalChannel = supabaseClient
        .channel(channelName)
        .on(
            "broadcast",
            { event: "call-signal" },
            payload => {
                const data = payload?.payload || {};

                if (!data || !data.callId) {
                    return;
                }

                if (data.receiverId && data.receiverId !== currentUser.id) {
                    return;
                }

                if (data.callerId && data.callerId === currentUser.id) {
                    return;
                }

                if (data.eventName === "call-offer") {
                    handleIncomingCall(data);
                } else if (data.eventName === "call-answer") {
                    handleRemoteAnswer(data);
                } else if (data.eventName === "ice-candidate") {
                    if (peerConnection && data.candidate) {
                        peerConnection
                            .addIceCandidate(new RTCIceCandidate(data.candidate))
                            .catch(() => {});
                    }
                } else if (data.eventName === "call-rejected") {
                    handleCallRejected(data);
                } else if (data.eventName === "call-ended") {
                    cleanupCall("Call ended");
                } else if (data.eventName === "call-busy") {
                    cleanupCall("User abhi kisi aur call par hai");
                    showToast("User abhi kisi aur call par hai");
                }
            }
        )
        .subscribe();
}

async function sendCallSignal(receiverId, eventName, extraPayload = {}) {
    if (!currentUser || !receiverId) {
        return;
    }

    const channel = supabaseClient.channel(getCallSignalChannelName(receiverId));

    await channel.subscribe();

    const payload = {
        callId: activeCallId || extraPayload.callId || crypto.randomUUID(),
        callerId: currentUser.id,
        receiverId,
        eventName,
        callType: activeCallType || extraPayload.callType || "audio",
        timestamp: new Date().toISOString(),
        ...extraPayload
    };

    await channel.send({
        type: "broadcast",
        event: "call-signal",
        payload
    });
}

function resetCallUiState() {
    if (callAvatar) {
        callAvatar.textContent = "U";
    }

    if (callUsername) {
        callUsername.textContent = "User";
    }

    if (callStatusText) {
        callStatusText.textContent = "Calling...";
    }

    if (incomingCallPanel) {
        incomingCallPanel.classList.add("hidden");
    }

    if (callIdleState) {
        callIdleState.hidden = true;
    }

    if (callOverlay) {
        callOverlay.querySelector(".call-display-area")?.classList.remove("has-remote-video", "has-local-video");
    }

    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }

    if (localVideo) {
        localVideo.srcObject = null;
    }

    if (callMuteBtn) {
        callMuteBtn.classList.remove("is-active");
        callMuteBtn.textContent = "🎤";
    }

    if (callCameraBtn) {
        callCameraBtn.classList.remove("is-active");
        callCameraBtn.textContent = "📹";
    }

    if (callSpeakerBtn) {
        callSpeakerBtn.classList.remove("is-active");
        callSpeakerBtn.textContent = "🔊";
    }

    isCallMicMuted = false;
    isCallCameraMuted = false;
    isCallSpeakerEnabled = true;
}

function cleanupCall(message) {
    if (peerConnection) {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.close();
        peerConnection = null;
    }

    if (localCallStream) {
        localCallStream.getTracks().forEach(track => track.stop());
        localCallStream = null;
    }

    if (remoteCallStream) {
        remoteCallStream.getTracks().forEach(track => track.stop());
        remoteCallStream = null;
    }

    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }

    if (localVideo) {
        localVideo.srcObject = null;
    }

    stopCallTimer();
    resetCallUiState();
    setCallOverlayVisible(false);

    activeCallId = null;
    activeCallType = null;
    activeCallPeerId = null;
    activeCallState = "idle";
    pendingIncomingOffer = null;
    pendingIncomingCaller = null;

    if (message) {
        showToast(message);
    }
}

async function createPeerConnection() {
    if (!window.RTCPeerConnection) {
        showToast("Is device/browser par call supported nahi hai");
        cleanupCall();
        return null;
    }

    peerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: "stun:stun.l.google.com:19302"
        }]
    });

    peerConnection.onicecandidate = event => {
        if (!event.candidate || !activeCallPeerId) {
            return;
        }

        sendCallSignal(activeCallPeerId, "ice-candidate", {
            callId: activeCallId,
            callType: activeCallType,
            candidate: event.candidate.toJSON()
        }).catch(() => {});
    };

    peerConnection.ontrack = event => {
        const stream = event.streams?.[0];

        if (!stream) {
            return;
        }

        remoteCallStream = stream;
        remoteVideo.srcObject = stream;
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        updateCallDisplayState();
    };

    if (localCallStream) {
        localCallStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localCallStream);
        });
    }

    return peerConnection;
}

async function startOutgoingCall(callType) {
    if (!currentUser || !selectedUser || selectedGroup) {
        return;
    }

    if (activeCallState !== "idle") {
        showToast("Call already in progress");
        return;
    }

    if (!window.isSecureContext && location.hostname !== "localhost") {
        showToast("Call ke liye HTTPS ya localhost required hai");
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Is device/browser par call supported nahi hai");
        return;
    }

    try {
        const constraints = callType === "video"
            ? {
                audio: true,
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            }
            : {
                audio: true,
                video: false
            };

        localCallStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (callType === "video") {
            hasCameraSupport = true;
        }

        if (localVideo) {
            localVideo.srcObject = localCallStream;
            localVideo.muted = true;
            localVideo.autoplay = true;
            localVideo.playsInline = true;
        }

        activeCallId = crypto.randomUUID();
        activeCallType = callType;
        activeCallPeerId = selectedUser.id;
        activeCallState = "calling";

        const firstLetter = (selectedUser.username || selectedUser.name || "U").charAt(0).toUpperCase();
        if (callAvatar) callAvatar.textContent = firstLetter;
        if (callUsername) callUsername.textContent = selectedUser.username || selectedUser.name || "User";
        setCallStatus("Calling...");
        setCallButtonsForMode(callType);
        setCallOverlayVisible(true);
        incomingCallPanel?.classList.add("hidden");
        updateCallDisplayState();

        const connection = await createPeerConnection();

        if (!connection) {
            return;
        }

        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);

        await sendCallSignal(selectedUser.id, "call-offer", {
            callId: activeCallId,
            callType: activeCallType,
            offer: offer,
            senderId: currentUser.id,
            receiverId: selectedUser.id
        });

        if (callType === "video") {
            if (callCameraBtn) callCameraBtn.classList.add("is-active");
        }

    } catch (error) {
        console.error("Call start error:", error);
        if (error?.name === "NotAllowedError") {
            showToast(callType === "video" ? "Camera permission allow karo" : "Microphone permission allow karo");
        } else {
            showToast("Is device/browser par call supported nahi hai");
        }
        cleanupCall();
    }
}

async function acceptCall() {
    if (!currentUser || !activeCallPeerId || !activeCallId) {
        return;
    }

    if (!window.isSecureContext && location.hostname !== "localhost") {
        showToast("Call ke liye HTTPS ya localhost required hai");
        return;
    }

    try {
        const constraints = activeCallType === "video"
            ? {
                audio: true,
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            }
            : {
                audio: true,
                video: false
            };

        localCallStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (localVideo) {
            localVideo.srcObject = localCallStream;
            localVideo.muted = true;
            localVideo.autoplay = true;
            localVideo.playsInline = true;
        }

        const connection = await createPeerConnection();
        if (!connection) {
            return;
        }

        if (pendingIncomingOffer) {
            await connection.setRemoteDescription(new RTCSessionDescription(pendingIncomingOffer));
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);

            await sendCallSignal(activeCallPeerId, "call-answer", {
                callId: activeCallId,
                callType: activeCallType,
                answer: answer
            });
        }

        incomingCallPanel?.classList.add("hidden");
        setCallButtonsForMode(activeCallType);
        setCallOverlayVisible(true);
        activeCallState = "connecting";
        setCallStatus("Connecting...");
        updateCallDisplayState();

        if (activeCallType === "video") {
            callCameraBtn?.classList.add("is-active");
            callCameraBtn.textContent = "📹";
        }

    } catch (error) {
        console.error("Accept call error:", error);
        if (error?.name === "NotAllowedError") {
            showToast(activeCallType === "video" ? "Camera permission allow karo" : "Microphone permission allow karo");
        } else {
            showToast("Is device/browser par call supported nahi hai");
        }
        cleanupCall();
    }
}

function handleIncomingCall(data) {
    if (!currentUser || !data || !data.callerId || !data.callId) {
        return;
    }

    if (activeCallState !== "idle") {
        sendCallSignal(data.callerId, "call-busy", {
            callId: data.callId,
            callType: data.callType
        }).catch(() => {});
        return;
    }

    activeCallId = data.callId;
    activeCallType = data.callType || "audio";
    activeCallPeerId = data.callerId;
    activeCallState = "ringing";
    pendingIncomingOffer = data.offer || null;

    if (data.callerId) {
        pendingIncomingCaller = data.callerId;
    }

    const defaultName = "User";
    const firstLetter = defaultName.charAt(0).toUpperCase();

    if (callAvatar) {
        callAvatar.textContent = firstLetter;
    }

    if (incomingCallAvatar) {
        incomingCallAvatar.textContent = firstLetter;
    }

    if (callUsername) {
        callUsername.textContent = defaultName;
    }

    if (incomingCallUsername) {
        incomingCallUsername.textContent = defaultName;
    }

    if (incomingCallType) {
        incomingCallType.textContent = activeCallType === "video" ? "Video call" : "Audio call";
    }

    if (callStatusText) {
        callStatusText.textContent = activeCallType === "video" ? "Video call" : "Audio call";
    }

    setCallButtonsForMode(activeCallType);
    setCallOverlayVisible(true);

    if (incomingCallPanel) {
        incomingCallPanel.classList.remove("hidden");
    }

    if (activeCallType === "video") {
        setCallStatus("Incoming video call");
    } else {
        setCallStatus("Incoming audio call");
    }

    if (data.callerId) {
        supabaseClient
            .from("profiles")
            .select("username, name, avatar_idx")
            .eq("id", data.callerId)
            .maybeSingle()
            .then(({ data: profile, error }) => {
                if (!error && profile) {
                    const username = profile.username || profile.name || "User";
                    const first = (username || "U").charAt(0).toUpperCase();

                    if (callUsername) {
                        callUsername.textContent = username;
                    }

                    if (incomingCallUsername) {
                        incomingCallUsername.textContent = username;
                    }

                    if (callAvatar) {
                        callAvatar.textContent = first;
                        renderProfileAvatarImage(callAvatar, profile);
                    }

                    if (incomingCallAvatar) {
                        incomingCallAvatar.textContent = first;
                        renderProfileAvatarImage(incomingCallAvatar, profile);
                    }
                }
            });
    }
}

function handleCallRejected(data) {
    if (!data || !data.callId || data.callId !== activeCallId) {
        return;
    }

    cleanupCall("Call declined");
}

async function handleRemoteAnswer(data) {
    if (!peerConnection || !data || !data.callId || data.callId !== activeCallId) {
        return;
    }

    if (data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        activeCallState = "connected";
        setCallStatus("Connected");
        startCallTimer();
        updateCallDisplayState();
    }
}

function toggleCallMute() {
    if (!localCallStream) {
        return;
    }

    isCallMicMuted = !isCallMicMuted;

    localCallStream.getAudioTracks().forEach(track => {
        track.enabled = !isCallMicMuted;
    });

    if (callMuteBtn) {
        callMuteBtn.classList.toggle("is-active", isCallMicMuted);
        callMuteBtn.textContent = isCallMicMuted ? "🔇" : "🎤";
    }
}

function toggleCallCamera() {
    if (!localCallStream || activeCallType !== "video") {
        return;
    }

    isCallCameraMuted = !isCallCameraMuted;

    localCallStream.getVideoTracks().forEach(track => {
        track.enabled = !isCallCameraMuted;
    });

    if (callCameraBtn) {
        callCameraBtn.classList.toggle("is-active", isCallCameraMuted);
        callCameraBtn.textContent = isCallCameraMuted ? "📷" : "📹";
    }
}

async function switchCallCamera() {
    if (!localCallStream || activeCallType !== "video") {
        return;
    }

    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";

    try {
        const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        const oldVideoTrack = localCallStream.getVideoTracks()[0];
        if (oldVideoTrack) {
            oldVideoTrack.stop();
        }

        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack) {
            localCallStream.removeTrack(localCallStream.getVideoTracks()[0]);
            localCallStream.addTrack(newVideoTrack);

            if (peerConnection) {
                const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
                if (sender) {
                    sender.replaceTrack(newVideoTrack);
                }
            }

            if (localVideo) {
                localVideo.srcObject = localCallStream;
            }
        }

    } catch (error) {
        console.error("Switch camera error:", error);
        showToast("Camera switch supported nahi hai");
    }
}

function toggleSpeaker() {
    isCallSpeakerEnabled = !isCallSpeakerEnabled;

    if (remoteVideo) {
        remoteVideo.muted = !isCallSpeakerEnabled;
    }

    if (callSpeakerBtn) {
        callSpeakerBtn.classList.toggle("is-active", isCallSpeakerEnabled);
        callSpeakerBtn.textContent = isCallSpeakerEnabled ? "🔊" : "🔉";
    }
}

async function endCall() {
    if (!currentUser || !activeCallId || !activeCallPeerId) {
        cleanupCall();
        return;
    }

    await sendCallSignal(activeCallPeerId, "call-ended", {
        callId: activeCallId,
        callType: activeCallType
    }).catch(() => {});

    cleanupCall("Call ended");
}

async function declineCall() {
    if (!currentUser || !activeCallPeerId || !activeCallId) {
        return;
    }

    await sendCallSignal(activeCallPeerId, "call-rejected", {
        callId: activeCallId,
        callType: activeCallType
    }).catch(() => {});

    cleanupCall("Call declined");
}

function updateCallButtonsVisibility() {
    if (selectedGroup || !selectedUser) {
        setDirectCallButtonsVisible(false);
        return;
    }

    setDirectCallButtonsVisible(true);
}

if (audioCallBtn) {
    audioCallBtn.addEventListener("click", function () {
        startOutgoingCall("audio");
    });
}

if (videoCallBtn) {
    videoCallBtn.addEventListener("click", function () {
        startOutgoingCall("video");
    });
}

if (callMuteBtn) {
    callMuteBtn.addEventListener("click", toggleCallMute);
}

if (callSpeakerBtn) {
    callSpeakerBtn.addEventListener("click", toggleSpeaker);
}

if (callCameraBtn) {
    callCameraBtn.addEventListener("click", toggleCallCamera);
}

if (callSwitchCameraBtn) {
    callSwitchCameraBtn.addEventListener("click", switchCallCamera);
}

if (callEndBtn) {
    callEndBtn.addEventListener("click", endCall);
}

if (acceptCallBtn) {
    acceptCallBtn.addEventListener("click", acceptCall);
}

if (declineCallBtn) {
    declineCallBtn.addEventListener("click", declineCall);
}

if (callMinimizeBtn) {
    callMinimizeBtn.addEventListener("click", function () {
        setCallOverlayVisible(false);
    });
}

if (callOverlay) {
    callOverlay.addEventListener("click", function (event) {
        if (event.target === callOverlay && activeCallState !== "idle") {
            setCallOverlayVisible(false);
        }
    });
}


if (newChatBtn) { 
 
    newChatBtn.addEventListener("click", function () { 
        openNewChatScreen();
    }); 
} 


// ========================= 
// DOM ELEMENTS 
// ========================= 
 
const backBtn = document.getElementById("backBtn"); 
const chatAvatar = document.getElementById("chatAvatar"); 
const chatUsername = document.getElementById("chatUsername"); 
const chatStatus = document.getElementById("chatStatus"); 
 
const userList = document.getElementById("userList"); 
const usersContainer = document.getElementById("usersContainer"); 
const newChatScreen = document.getElementById("newChatScreen");
const newChatBackBtn = document.getElementById("newChatBackBtn");
const newChatSearchInput = document.getElementById("newChatSearchInput");
const newChatSuggestedList = document.getElementById("newChatSuggestedList");
let newChatEligibleUsers = [];
let connectedChatUsersCache = null;
let connectedChatUsersCacheUserId = null;

function closeNewChatScreen() {
    if (!newChatScreen) return;
    newChatScreen.hidden = true;
    newChatScreen.setAttribute("aria-hidden", "true");
}

async function openNewChatScreen() {
    if (!newChatScreen || !currentUser) return;
    newChatScreen.hidden = false;
    newChatScreen.setAttribute("aria-hidden", "false");
    if (newChatSearchInput) newChatSearchInput.value = "";
    await loadNewChatSuggestions();
}

async function loadNewChatSuggestions() {
    if (!currentUser || !newChatSuggestedList) return;
    newChatSuggestedList.innerHTML =
        `<div class="new-chat-empty">Loading connected people...</div>`;

    newChatEligibleUsers = await getConnectedChatUsers(true);
    renderNewChatSuggestions();
}

async function getConnectedChatUsers(forceReload = false) {
    if (!currentUser) return [];
    if (
        !forceReload &&
        connectedChatUsersCache &&
        connectedChatUsersCacheUserId === currentUser.id
    ) {
        return connectedChatUsersCache;
    }

    const [followingResult, followersResult] = await Promise.all([
        supabaseClient
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUser.id),
        supabaseClient
            .from("follows")
            .select("follower_id")
            .eq("following_id", currentUser.id)
    ]);

    if (followingResult.error || followersResult.error) {
        console.error("Load connected people error:", followingResult.error || followersResult.error);
        return [];
    }

    const connectedIds = [...new Set([
        ...(followingResult.data || []).map(row => row.following_id),
        ...(followersResult.data || []).map(row => row.follower_id)
    ])].filter(id => id && id !== currentUser.id);

    if (connectedIds.length === 0) {
        connectedChatUsersCache = [];
        connectedChatUsersCacheUserId = currentUser.id;
        return connectedChatUsersCache;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, name, avatar_idx, is_blocked")
        .in("id", connectedIds)
        .neq("id", currentUser.id)
        .order("username", { ascending: true });

    if (error) {
        console.error("Load connected profiles error:", error);
        return [];
    }

    connectedChatUsersCache = (data || []).filter(user => user.is_blocked !== true);
    connectedChatUsersCacheUserId = currentUser.id;
    return connectedChatUsersCache;
}

function renderNewChatSuggestions() {
    if (!newChatSuggestedList) return;
    const query = (newChatSearchInput?.value || "").trim().toLowerCase();
    const filteredUsers = newChatEligibleUsers.filter(user => {
        const username = user.username || "";
        const name = user.name || "";
        return !query || username.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    });

    newChatSuggestedList.replaceChildren();
    if (filteredUsers.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "new-chat-empty";
        emptyState.textContent = newChatEligibleUsers.length
            ? "No connected people match your search."
            : "People you can chat with will appear here.";
        newChatSuggestedList.appendChild(emptyState);
        return;
    }

    filteredUsers.forEach(user => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "new-chat-person";

        const avatar = document.createElement("span");
        avatar.className = "new-chat-person-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = (user.username || user.name || "U").charAt(0).toUpperCase();
        renderProfileAvatarImage(avatar, user);

        const details = document.createElement("span");
        details.className = "new-chat-person-details";
        const displayName = document.createElement("strong");
        displayName.textContent = user.name || user.username || "User";
        details.appendChild(displayName);

        if (user.username) {
            const handle = document.createElement("small");
            handle.textContent = `@${user.username}`;
            details.appendChild(handle);
        }

        item.append(avatar, details);
        item.addEventListener("click", async () => {
            item.disabled = true;
            const allowed = await canStartDirectChatWith(user.id);
            if (!allowed) {
                item.disabled = false;
                showToast("You can only start chats with people you are connected with.");
                return;
            }

            closeNewChatScreen();
            await selectUser(user);
        });

        newChatSuggestedList.appendChild(item);
    });
}

async function canStartDirectChatWith(userId) {
    if (!currentUser || !userId || userId === currentUser.id) return false;

    const [followingResult, followerResult, profileResult] = await Promise.all([
        supabaseClient
            .from("follows")
            .select("follower_id")
            .eq("follower_id", currentUser.id)
            .eq("following_id", userId)
            .maybeSingle(),
        supabaseClient
            .from("follows")
            .select("follower_id")
            .eq("follower_id", userId)
            .eq("following_id", currentUser.id)
            .maybeSingle(),
        supabaseClient
            .from("profiles")
            .select("id, is_blocked")
            .eq("id", userId)
            .maybeSingle()
    ]);

    if (
        followingResult.error ||
        followerResult.error ||
        profileResult.error ||
        !profileResult.data ||
        profileResult.data.is_blocked === true
    ) {
        return false;
    }

    return Boolean(followingResult.data || followerResult.data);
}

if (newChatBackBtn) {
    newChatBackBtn.addEventListener("click", closeNewChatScreen);
}

if (newChatSearchInput) {
    newChatSearchInput.addEventListener("input", renderNewChatSuggestions);
}

const chatArea = document.getElementById("chatArea"); 
 
const messageBox = document.getElementById("messageBox"); 
const messageInput = document.getElementById("messageInput"); 
const sendBtn = document.getElementById("sendBtn"); 
 

// ========================= 
// CHECK LOGIN 
// ========================= 
 
async function checkLogin() { 
 
    const { 
        data: { session }, 
        error 
    } = await supabaseClient.auth.getSession(); 
 
    if (error) { 
        console.error("Session error:", error); 
        return null; 
    } 
 
    if (!session) { 
        window.location.href = "index.html"; 
        return null; 
    } 
 
    currentUser = session.user; 
    ensureCallSignalChannel();
 
    console.log("CURRENT USER:", currentUser.id); 
 
    // Set current user online 
    try {
        await supabaseClient
            .from("profiles")
            .update({
                is_online: true,
                last_seen: new Date().toISOString()
            })
            .eq("id", currentUser.id);
    } catch {
        // The normal heartbeat below retries after temporary network failures.
    }
 
    onlineInterval = setInterval(async () => { 
 
        if (!currentUser) { 
            return; 
        } 
 
        try {
            await supabaseClient
                .from("profiles")
                .update({
                    is_online: true,
                    last_seen: new Date().toISOString()
                })
                .eq("id", currentUser.id);
        } catch {
            // Retry silently on the next 30-second heartbeat.
        }
 
    }, 30000); 
 
    return session; 
} 


// ========================= 
// LOAD USERS 
// ========================= 
 
async function loadUsers(conversationsOnly = false, requestId = null) { 
 
    usersContainer.innerHTML = 
        `<div class="loading">Loading users...</div>`; 
 
    const { data, error } = await supabaseClient 
        .from("profiles") 
        .select("id, username, name, avatar_idx") 
        .neq("id", currentUser.id) 
        .order("username", { ascending: true }); 
 
    if (error) { 
 
        console.error("Load users error:", error); 
 
        usersContainer.innerHTML = 
            `<div class="loading">Unable to load users</div>`; 
 
        return; 
    } 

    if (requestId !== null && requestId !== chatListFilterRequest) {
        return;
    }
 
    if (!data || data.length === 0) { 
 
        usersContainer.innerHTML = 
            `<div class="chat-list-empty">${conversationsOnly ? "No conversations yet" : "No other users found"}</div>`; 
 
        return; 
    } 
 
    usersContainer.innerHTML = ""; 

    let conversationActivity = new Map();
    if (conversationsOnly) {
        conversationActivity = await getDirectConversationActivity();
    }

    if (requestId !== null && requestId !== chatListFilterRequest) {
        return;
    }

    const visibleUsers = conversationsOnly
        ? data
            .filter(user => conversationActivity.has(user.id))
            .sort((a, b) =>
                conversationActivity.get(b.id).timestamp -
                conversationActivity.get(a.id).timestamp
            )
        : data;

    if (conversationsOnly && visibleUsers.length === 0) {
        usersContainer.innerHTML =
            `<div class="chat-list-empty">No conversations yet</div>`;
        return;
    }

    visibleUsers.forEach(user => { 
 
        const item = document.createElement("div"); 
 
        item.className = "user-item"; 
 
        const firstLetter = 
            (user.username || user.name || "U") 
            .charAt(0) 
            .toUpperCase(); 
 
        if (conversationsOnly) {
            const activity = conversationActivity.get(user.id);
            item.classList.toggle("has-unread", activity.unreadCount > 0);
            item.innerHTML = `
                <div class="user-avatar">
                    ${firstLetter}
                </div>
                <div class="user-details">
                    <strong>${escapeHTML(user.username || user.name || "User")}</strong>
                    <small class="chat-row-preview">${escapeHTML(activity.preview)}</small>
                </div>
                <span class="chat-row-meta">
                    <time>${escapeHTML(formatMessageTime(activity.createdAt))}</time>
                    ${activity.unreadCount
                        ? `<span class="unread-count">${activity.unreadCount}</span>`
                        : ""}
                </span>
            `;
        } else {
            item.innerHTML = ` 
            <div class="user-avatar"> 
                ${firstLetter} 
            </div> 
 
            <div class="user-details"> 
                <strong>${escapeHTML(user.username || "user")}</strong> 
                <small>${escapeHTML(user.name || "")}</small> 
            </div> 
        `; 
        }

        renderProfileAvatarImage(item.querySelector(".user-avatar"), user);
 
        item.addEventListener("click", () => { 
            selectUser(user); 
        }); 
 
        usersContainer.appendChild(item); 
    }); 
} 

async function getDirectConversationActivity() {
    const { data, error } = await supabaseClient
        .from("messages")
        .select("sender_id, receiver_id, text, created_at, is_read")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false })
        .limit(1000);

    if (error) {
        console.error("Load conversation activity error:", error);
        return new Map();
    }

    const activity = new Map();
    (data || []).forEach(message => {
        const peerId = message.sender_id === currentUser.id
            ? message.receiver_id
            : message.sender_id;
        if (!peerId) return;

        if (!activity.has(peerId)) {
            activity.set(peerId, {
                timestamp: Date.parse(message.created_at) || 0,
                createdAt: message.created_at,
                preview: `${message.sender_id === currentUser.id ? "You: " : ""}${message.text || ""}`,
                unreadCount: 0
            });
        }

        if (
            message.receiver_id === currentUser.id &&
            message.is_read === false
        ) {
            activity.get(peerId).unreadCount += 1;
        }
    });

    return activity;
}


async function getUnreadUserIds() { 
 
    if (!currentUser) { 
        return []; 
    } 
 
    const { data, error } = await supabaseClient 
        .from("messages") 
        .select("sender_id") 
        .eq("receiver_id", currentUser.id) 
        .eq("is_read", false); 
 
    if (error) { 
        console.error("Unread messages error:", error); 
        return []; 
    } 
 
    if (!data) { 
        return []; 
    } 
 
    return [ 
        ...new Set( 
            data.map(message => message.sender_id) 
        ) 
    ]; 
} 


// ========================= 
// SELECT USER 
// ========================= 
 
async function selectUser(user) { 

    resetActivitySearch();
    closeDirectChatInfo();
    closeDirectChatSearch(false);
    selectedUser = user; 
    selectedGroup = null;
    updateCallButtonsVisibility();
    document.body.classList.remove("group-chat-active");
    setGroupHeaderActionable(false);
    setDirectChatHeaderActionable(true);
    document.body.classList.add("chat-view-active");
    if (groupSettingsPanel) {
        groupSettingsPanel.style.display = "none";
        groupSettingsPanel.setAttribute("aria-hidden", "true");
    }

    if (addMemberBtn) {
        addMemberBtn.style.display = "none";
    }

    if (leaveGroupBtn) {
        leaveGroupBtn.style.display = "none";
    }

    // Group buttons hide
    if (inviteGroupBtn) {
        inviteGroupBtn.style.display = "none";
    }

    if (changeGroupAvatarBtn) {
        changeGroupAvatarBtn.style.display = "none";
    }

    updateChatStatus(); 
 
    if (statusInterval) { 
        clearInterval(statusInterval); 
    } 
 
    statusInterval = setInterval(() => { 
        updateChatStatus(); 
    }, 5000); 
 
    if (typingCheckInterval) { 
        clearInterval(typingCheckInterval); 
    } 
 
    typingCheckInterval = setInterval(async () => { 
 
        if (!selectedUser) { 
            return; 
        } 
 
        const { data, error } = await supabaseClient 
            .from("profiles") 
            .select("is_typing, is_online, last_seen") 
            .eq("id", selectedUser.id) 
            .single(); 
 
        if (error || !data) { 
            return; 
        } 
 
        if (data.is_typing) { 
            chatStatus.textContent = "✍️ is typing..."; 
        } else { 
            updateChatStatus(); 
        } 
 
    }, 1000); 
 
    console.log("SELECTED USER:", selectedUser.id); 
 
    const firstLetter = 
        (user.username || user.name || "U") 
        .charAt(0) 
        .toUpperCase(); 
 
    chatAvatar.textContent = firstLetter; 
    renderProfileAvatarImage(chatAvatar, user);
 
    chatUsername.textContent = 
        user.username || user.name || "User"; 
 
    chatStatus.textContent = "inware"; 
 
    userList.style.display = "none"; 
 
    chatArea.innerHTML = ""; 
    applyDirectChatPreferences();
 
    messageBox.style.display = "flex"; 
 
    await loadMessages(); 

    if (!selectedUser || selectedUser.id !== user.id || selectedGroup) {
        return;
    }
 
    subscribeToMessages(); 
} 


// =========================
// GROUP TYPING CHECK
// =========================

function startGroupTypingCheck() {

    if (typingCheckInterval) {
        clearInterval(typingCheckInterval);
    }

    typingCheckInterval = setInterval(async () => {

        if (!selectedGroup) {
            return;
        }

        const { data, error } =
            await supabaseClient
                .from("group_members")
                .select("user_id")
                .eq("group_id", selectedGroup.id);

        if (error || !data) {
            return;
        }

        const memberIds =
            data
                .map(member => member.user_id)
                .filter(id => id !== currentUser.id);

        if (memberIds.length === 0) {
            chatStatus.textContent = "👥 Group chat";
            return;
        }

        const { data: typingUsers, error: typingError } =
            await supabaseClient
                .from("profiles")
                .select("username, name")
                .in("id", memberIds)
                .eq("is_typing", true);

        if (typingError) {
            return;
        }

        if (typingUsers && typingUsers.length > 0) {

            const names =
                typingUsers
                    .map(user =>
                        user.username ||
                        user.name ||
                        "Someone"
                    );

            chatStatus.textContent =
                "✍️ " + names.join(", ") + " typing...";

        } else {

            chatStatus.textContent =
                "👥 Group chat";
        }

    }, 1000);
}


// ========================= 
// LOAD OLD MESSAGES 
// ========================= 
 
async function loadMessages() { 
 
    if (!currentUser || !selectedUser) { 
        return; 
    } 
 
    chatArea.innerHTML = 
        `<div class="loading">Loading messages...</div>`; 
 
    const { data, error } = await supabaseClient 
        .from("messages") 
        .select(` 
            id, 
            sender_id, 
            receiver_id, 
            text, 
            created_at, 
            is_read 
        `) 
        .or( 
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})` 
        ) 
        .order("created_at", { 
            ascending: true 
        }); 
 
    if (error) { 
 
        console.error("Load messages error:", error); 
 
        chatArea.innerHTML = 
            `<div class="loading">Unable to load messages</div>`; 
 
        return; 
    } 
 
    const unreadMessageIds = data 
        .filter(message => 
            message.receiver_id === currentUser.id && 
            message.is_read === false 
        ) 
        .map(message => message.id); 
 
    if (unreadMessageIds.length > 0) { 
 
        const { error: readError } = 
            await supabaseClient 
                .from("messages") 
                .update({ 
                    is_read: true 
                }) 
                .in("id", unreadMessageIds); 
 
        if (readError) { 
            console.error( 
                "Mark messages read error:", 
                readError 
            ); 
        } 
    } 
 
    chatArea.innerHTML = ""; 
 
    if (!data || data.length === 0) { 
 
        chatArea.innerHTML = 
            `<div class="no-chat">No messages yet. Say hello 👋</div>`; 
 
        return; 
    } 
 
    data.forEach(message => { 
 
        renderMessage(message); 
 
    }); 
 
    scrollToBottom(); 
} 


async function updateChatStatus() { 
 
    if (!selectedUser) { 
        return; 
    } 
 
    const { data, error } = await supabaseClient 
        .from("profiles") 
        .select("is_online, last_seen") 
        .eq("id", selectedUser.id) 
        .single(); 
 
    if (error) { 
        console.error("Status error:", error); 
        chatStatus.textContent = "inware"; 
        return; 
    } 
 
    if (!data) { 
        chatStatus.textContent = "inware"; 
        return; 
    } 
 
    const lastSeen = data.last_seen 
        ? new Date(data.last_seen) 
        : null; 
 
    const now = new Date(); 
 
    if ( 
        data.is_online && 
        lastSeen && 
        (now.getTime() - lastSeen.getTime()) < 60000 
    ) { 
        chatStatus.textContent = "🟢 Online"; 
        return; 
    } 
 
    if (!lastSeen) { 
        chatStatus.textContent = "⚫ Offline"; 
        return; 
    } 
 
    const diffSeconds = 
        Math.floor( 
            (now.getTime() - lastSeen.getTime()) / 1000 
        ); 
 
    if (diffSeconds < 60) { 
 
        chatStatus.textContent = 
            "Last seen just now"; 
 
    } else if (diffSeconds < 3600) { 
 
        const minutes = 
            Math.floor(diffSeconds / 60); 
 
        chatStatus.textContent = 
            `Last seen ${minutes} min ago`; 
 
    } else if (diffSeconds < 86400) { 
 
        const hours = 
            Math.floor(diffSeconds / 3600); 
 
        chatStatus.textContent = 
            `Last seen ${hours} hr ago`; 
 
    } else { 
 
        chatStatus.textContent = 
            "Last seen " + 
            lastSeen.toLocaleString("en-IN", { 
                timeZone: "Asia/Kolkata", 
                day: "2-digit", 
                month: "short", 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
            }); 
    } 
} 


// ========================= 
// SEND MESSAGE 
// ========================= 
 
async function sendMessage() { 
 
    if (!currentUser) { 
        alert("Please login again."); 
        return; 
    } 
 
    if (!selectedUser) { 
        alert("Please select a user."); 
        return; 
    } 
 
    const message = 
        messageInput.value.trim(); 
 
    if (!message) { 
        return; 
    } 
 
    sendBtn.disabled = true; 
 
    console.log("Sending message..."); 
    console.log("SENDER:", currentUser.id); 
    console.log("RECEIVER:", selectedUser.id); 
 
    const { data, error } = 
        await supabaseClient.rpc( 
            "send_message", 
            { 
                p_receiver_id: selectedUser.id, 
                p_text: message 
            } 
        ); 
 
    sendBtn.disabled = false; 
 
    if (error) { 
 
        console.error( 
            "Send message error:", 
            error 
        ); 
 
        alert( 
            "Message send failed: " + 
            error.message 
        ); 
 
        return; 
    } 
 
    console.log( 
        "Message sent successfully:", 
        data 
    ); 
 
    messageInput.value = ""; 
 
    if (data) { 
 
        const sentMessage = 
            Array.isArray(data) 
                ? data[0] 
                : data; 
 
        if ( 
            sentMessage && 
            sentMessage.id && 
            !document.querySelector( 
                `[data-message-id="${sentMessage.id}"]` 
            ) 
        ) { 
 
            removeNoChatMessage(); 
 
            renderMessage(sentMessage); 
 
            scrollToBottom(); 
        } 
    } 
} 


// ========================= 
// REALTIME 
// ========================= 
 
function subscribeToMessages() { 
 
    if (!currentUser) { 
        return; 
    } 
 
    if (realtimeChannel) { 
 
        supabaseClient.removeChannel( 
            realtimeChannel 
        ); 
 
        realtimeChannel = null; 
    } 
 
    realtimeChannel = 
        supabaseClient 
            .channel( 
                "chat-" + 
                currentUser.id + 
                "-" + 
                selectedUser.id 
            ) 
            .on( 
                "postgres_changes", 
                { 
                    event: "INSERT", 
                    schema: "public", 
                    table: "messages" 
                }, 
                payload => { 
 
                    const message = 
                        payload.new; 
 
                    if ( 
                        !message || 
                        !message.id 
                    ) { 
                        return; 
                    } 
 
                    const belongsToChat = 
                        ( 
                            message.sender_id === 
                            currentUser.id && 
                            message.receiver_id === 
                            selectedUser.id 
                        ) 
                        || 
                        ( 
                            message.sender_id === 
                            selectedUser.id && 
                            message.receiver_id === 
                            currentUser.id 
                        ); 
 
                    if (!belongsToChat) { 
                        return; 
                    } 
 
                    if ( 
                        document.querySelector( 
                            `[data-message-id="${message.id}"]` 
                        ) 
                    ) { 
                        return; 
                    } 
 
                    removeNoChatMessage(); 
 
                    renderMessage(message); 
 
                    scrollToBottom(); 
                } 
            ) 
            .subscribe(status => { 
 
                console.log( 
                    "Realtime status:", 
                    status 
                ); 
            }); 
} 


// =========================
// GROUP REALTIME
// =========================

function subscribeToGroupMessages() {

    if (!currentUser || !selectedGroup) {
        return;
    }

    if (groupRealtimeChannel) {

        supabaseClient.removeChannel(
            groupRealtimeChannel
        );

        groupRealtimeChannel = null;
    }

    groupRealtimeChannel =
        supabaseClient
            .channel(
                "group-chat-" +
                selectedGroup.id
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "group_messages",
                    filter:
                        "group_id=eq." +
                        selectedGroup.id
                },
                payload => {

                    const message =
                        payload.new;

                    if (
                        !message ||
                        !message.id
                    ) {
                        return;
                    }

                    if (
                        document.querySelector(
                            `[data-message-id="${message.id}"]`
                        )
                    ) {
                        return;
                    }

                    removeNoChatMessage();

                    const messageElement =
                        document.createElement("div");

                    const isMine =
                        message.sender_id ===
                        currentUser.id;

                    messageElement.className =
                        isMine
                            ? "message my-message"
                            : "message other-message";

                    messageElement.dataset.messageId =
                        message.id;

                    messageElement.innerHTML = `
                        <div class="message-text">
                            ${escapeHTML(
                                message.text || ""
                            )}
                        </div>

                        <div class="message-time">
                            ${formatMessageTime(
                                message.created_at
                            )}
                        </div>
                    `;

                    chatArea.appendChild(
                        messageElement
                    );

                    scrollToBottom();
                }
            )
            .subscribe(status => {

                console.log(
                    "Group Realtime status:",
                    status
                );

            });
}


// ========================= 
// BACK BUTTON 
// ========================= 
 
if (backBtn) { 
 
    backBtn.addEventListener( 
        "click", 
        () => { 

            if (document.body.classList.contains("direct-chat-search-active")) {
                closeDirectChatSearch();
                return;
            }

            if (
                selectedUser &&
                directChatInfoPanel &&
                directChatInfoPanel.style.display !== "none"
            ) {
                handleDirectChatInfoBack();
                return;
            }

            if (
                selectedGroup &&
                groupSettingsPanel &&
                groupSettingsPanel.style.display !== "none"
            ) {
                handleGroupScreenBack();
                return;
            }
 
            if (selectedUser || selectedGroup) { 

                updateCallButtonsVisibility();
                closeDirectChatInfo();
                closeDirectChatSearch(false);

                if (groupSettingsPanel) {
                    groupSettingsPanel.style.display = "none";
                    groupSettingsPanel.setAttribute("aria-hidden", "true");
                }
                document.body.classList.remove("group-chat-active");
                setGroupHeaderActionable(false);
 
                selectedUser = null; 
                selectedGroup = null;
                setDirectChatHeaderActionable(false);
                updateCallButtonsVisibility();
                document.body.classList.remove("chat-view-active");
 
                if (realtimeChannel) { 
 
                    supabaseClient.removeChannel( 
                        realtimeChannel 
                    ); 
 
                    realtimeChannel = null; 
                } 

                if (groupRealtimeChannel) {
                    supabaseClient.removeChannel(groupRealtimeChannel);
                    groupRealtimeChannel = null;
                }
 
                userList.style.display = "block"; 
 
                chatArea.innerHTML = ` 
                    <div class="no-chat"> 
                        Select a user to start chatting 💬 
                    </div> 
                `; 
 
                chatUsername.textContent = 
                    "Select user"; 
 
                chatStatus.textContent = 
                    "inware"; 
 
                chatAvatar.textContent = 
                    "U"; 
 
                messageBox.style.display = 
                    "none"; 

                if (addMemberBtn) {
                    addMemberBtn.style.display = "none";
                }

                if (leaveGroupBtn) {
                    leaveGroupBtn.style.display = "none";
                }

                if (inviteGroupBtn) {
                    inviteGroupBtn.style.display = "none";
                }

                if (changeGroupAvatarBtn) {
                    changeGroupAvatarBtn.style.display = "none";
                }

                if (editGroupBtn) {
                    editGroupBtn.style.display = "none";
                }

                if (groupSettingsBtn) {
                    groupSettingsBtn.style.display = "none";
                }
 
            } else { 
 
                window.location.href = 
                    "home.html"; 
            } 
        } 
    ); 
} 


// ========================= 
// SEND BUTTON 
// ========================= 
 
if (sendBtn) {

    sendBtn.addEventListener("click", function () {

        if (selectedGroup) {

            sendGroupMessage();

        } else if (selectedUser) {

            sendMessage();

        }

    });

}
 

// =========================
// TYPING STATUS
// =========================

let typingTimeout = null;

if (messageInput) {

    messageInput.addEventListener("input", async function () {

        if (!currentUser) {
            return;
        }

        const text = messageInput.value.trim();

        if (text.length > 0) {

            const { error } = await supabaseClient
                .from("profiles")
                .update({
                    is_typing: true
                })
                .eq("id", currentUser.id);

            if (error) {
                console.error(
                    "Typing status error:",
                    error
                );
            }

            clearTimeout(typingTimeout);

            typingTimeout = setTimeout(async function () {

                const { error } = await supabaseClient
                    .from("profiles")
                    .update({
                        is_typing: false
                    })
                    .eq("id", currentUser.id);

                if (error) {
                    console.error(
                        "Typing status error:",
                        error
                    );
                }

            }, 2000);

        } else {

            const { error } = await supabaseClient
                .from("profiles")
                .update({
                    is_typing: false
                })
                .eq("id", currentUser.id);

            if (error) {
                console.error(
                    "Typing status error:",
                    error
                );
            }
        }

    });

}


// ========================= 
// SCROLL 
// ========================= 
 
function scrollToBottom() { 
 
    setTimeout(() => { 
 
        chatArea.scrollTop = 
            chatArea.scrollHeight; 
 
    }, 50); 
} 


// ========================= 
// REMOVE EMPTY MESSAGE 
// ========================= 
 
function removeNoChatMessage() { 
 
    const emptyMessage = 
        chatArea.querySelector( 
            ".no-chat" 
        ); 
 
    if (emptyMessage) { 
        emptyMessage.remove(); 
    } 
} 


// ========================= 
// HTML ESCAPE 
// ========================= 
 
function escapeHTML(value) { 
 
    const div = 
        document.createElement("div"); 
 
    div.textContent = 
        value == null 
            ? "" 
            : String(value); 
 
    return div.innerHTML; 
} 


// ========================= 
// START APP 
// ========================= 
 
async function startChat() { 
 
    const session = 
        await checkLogin(); 
 
    if (!session) { 
        return; 
    } 
 
    await loadUsers(); 

    const urlParams =
        new URLSearchParams(window.location.search);

    const userId =
        urlParams.get("user");

    const groupId =
        urlParams.get("group");


// =========================
// Open User Chat
// =========================

if (userId) {

    const {
        data: user,
        error
    } = await supabaseClient
        .from("profiles")
        .select("id, username, name, avatar_idx")
        .eq("id", userId)
        .maybeSingle();

    if (!error && user) {
        await selectUser(user);
    }
}


// =========================
// Open Group Chat
// =========================

if (groupId) {

    const {
        data: groupData,
        error
    } = await supabaseClient.rpc(
        "get_group_for_invite",
        {
            p_group_id: groupId
        }
    );

    const group = groupData?.[0];

    if (error || !group) {
        console.error(
            "Load invite group error:",
            error
        );

        alert("Group not found.");
        return;
    }
    

    const {
        data: membership,
        error: memberError
    } =
        await supabaseClient
            .from("group_members")
            .select("id")
            .eq("group_id", group.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

    if (memberError) {
        console.error(
            "Check group membership error:",
            memberError
        );
        return;
    }

    if (!membership) {

        const joinGroup = confirm(
            "Join " +
            (group.name || "this group") +
            "? 👥"
        );

        if (!joinGroup) {
            return;
        }

        const { error: joinError } =
            await supabaseClient.rpc(
                "join_group",
                {
                    p_group_id: group.id
                }
            );

        if (joinError) {

            console.error(
                "Join group error:",
                joinError
            );

            alert(
                "Unable to join group: " +
                joinError.message
            );

            return;
        }

        alert(
            "You joined " +
            (group.name || "the group") +
            "! 🎉"
        );
    }

    selectedGroup = group;
    selectedUser = null;
    updateCallButtonsVisibility();
    document.body.classList.add("chat-view-active");
    document.body.classList.add("group-chat-active");
    setGroupHeaderActionable(true);
    if (groupSettingsPanel) {
        groupSettingsPanel.style.display = "none";
        groupSettingsPanel.setAttribute("aria-hidden", "true");
    }
    if (addMemberPanel) addMemberPanel.style.display = "none";

    startGroupTypingCheck();

    if (addMemberBtn) {
    addMemberBtn.style.display =
        group.created_by === currentUser.id
            ? "flex"
            : "none";
}

    if (leaveGroupBtn) {
        leaveGroupBtn.style.display = "flex";
    }

    if (inviteGroupBtn) {
        inviteGroupBtn.style.display = "flex";
    }

    if (changeGroupAvatarBtn) {
        changeGroupAvatarBtn.style.display =
            group.created_by === currentUser.id
                ? "flex"
                : "none";
    }

    subscribeToGroupMessages();

    chatUsername.textContent =
        group.name || "Group";

    // GROUP AVATAR
    if (group.avatar_url) {

        chatAvatar.innerHTML = `
            <img
                src="${escapeHTML(group.avatar_url)}"
                alt="Group"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                "
            >
        `;

    } else {

        chatAvatar.textContent =
            (group.name || "G")
                .charAt(0)
                .toUpperCase();
    }

    chatStatus.textContent =
        "👥 Group chat";

    userList.style.display = "none";

    messageBox.style.display = "flex";

    chatArea.innerHTML = `
        <div class="loading">
            Loading group messages...
        </div>
    `;

    await loadGroupMessages();
}
 
    console.log( 
        "Chat app ready." 
    ); 
} 


function renderMessage(message) { 
 
    const messageElement = document.createElement("div"); 
 
    const isMine = message.sender_id === currentUser.id; 
 
    messageElement.className = isMine 
        ? "message my-message" 
        : "message other-message"; 
 
    messageElement.dataset.messageId = message.id; 
 
    messageElement.innerHTML = ` 
        <div class="message-text"> 
            ${escapeHTML(message.text || "")} 
        </div> 
 
        <div class="message-time"> 
            ${formatMessageTime(message.created_at)} 
        </div> 
    `; 
 
    chatArea.appendChild(messageElement); 
    applyDirectChatMessageSearch();
} 


function formatMessageTime(createdAt) {

    if (!createdAt) {
        return "";
    }

    const date = new Date(createdAt);

    if (isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}


document.querySelectorAll(".filter-btn").forEach(button => { 
 
    button.addEventListener("click", async function () { 
        const requestId = ++chatListFilterRequest;
 
        document.querySelectorAll(".filter-btn") 
            .forEach(btn => { 
                btn.classList.remove("active"); 
                btn.setAttribute("aria-pressed", "false");
            }); 
         
        this.classList.add("active"); 
        this.setAttribute("aria-pressed", "true");
 
        const filter = this.dataset.filter; 
 
        const groupsTitle = 
            document.querySelector(".chat-category-title"); 

        const groupsSection = 
            document.getElementById("groupsSection"); 

        const groupsContainer = 
            document.getElementById("groupsContainer"); 


        // ========================= 
        // ALL 
        // ========================= 
 
        if (filter === "all") { 

            if (groupsSection) { 
                groupsSection.style.display = "block"; 
            } 

            userList.style.display = "block"; 
 
            usersContainer.style.display = "block"; 
 
            if (groupsTitle) { 
                groupsTitle.style.display = "block"; 
            } 
 
            if (groupsContainer) { 
                groupsContainer.style.display = "block"; 
            } 
 
            if (createGroupBtn) { 
                createGroupBtn.style.display = "block"; 
            } 

            const userSearchBox =
                document.getElementById("userSearchInput");
            if (userSearchBox && userSearchBox.parentElement) {
                userSearchBox.parentElement.style.display = "none";
            }
            const userSectionTitle = document.querySelector(".section-title");
            if (userSectionTitle) {
                userSectionTitle.textContent = "Conversations";
            }

            await Promise.all([
                loadUsers(true, requestId),
                loadGroups(requestId)
            ]);
 
            return; 
        } 


        // ========================= 
        // UNREAD 
        // ========================= 
 
        if (filter === "unread") { 

            if (groupsSection) { 
                groupsSection.style.display = "none"; 
            } 

            userList.style.display = "block"; 
 
            usersContainer.style.display = "block"; 
 
            if (groupsTitle) { 
                groupsTitle.style.display = "none"; 
            } 
 
            if (groupsContainer) { 
                groupsContainer.style.display = "none"; 
            } 
 
            if (createGroupBtn) { 
                createGroupBtn.style.display = "none"; 
            } 

            const unreadSearchBox =
                document.getElementById("userSearchInput");
            if (unreadSearchBox && unreadSearchBox.parentElement) {
                unreadSearchBox.parentElement.style.display = "none";
            }
            const unreadSectionTitle =
                document.querySelector(".section-title");
            if (unreadSectionTitle) {
                unreadSectionTitle.textContent = "Unread";
                unreadSectionTitle.style.display = "block";
            }
 
            const unreadUserIds = 
                await getUnreadUserIds(); 

            if (requestId !== chatListFilterRequest) return;
 
            if (unreadUserIds.length === 0) { 
 
                usersContainer.innerHTML = 
                    `<div class="chat-list-empty">No unread messages</div>`; 
 
                return; 
            } 
 
            const { data, error } = 
                await supabaseClient 
                    .from("profiles") 
                    .select( 
                        "id, username, name, avatar_idx" 
                    ) 
                    .in("id", unreadUserIds) 
                    .order("username", { 
                        ascending: true 
                    }); 

            const conversationActivity =
                await getDirectConversationActivity();

            if (requestId !== chatListFilterRequest) return;
 
            console.log( 
                "UNREAD PROFILE DATA:", 
                data 
            ); 
 
            console.log( 
                "UNREAD PROFILE ERROR:", 
                error 
            ); 
 
            if (error) { 
 
                console.error( 
                    "Unread users error:", 
                    error 
                ); 
 
                return; 
            } 
 
            usersContainer.innerHTML = ""; 
 
            if (!data || data.length === 0) { 
 
                usersContainer.innerHTML = 
                    `<div class="chat-list-empty">No unread messages</div>`; 
 
                return; 
            } 
 
            const unreadProfiles = data
                .filter(user => conversationActivity.has(user.id))
                .sort((a, b) =>
                    conversationActivity.get(b.id).timestamp -
                    conversationActivity.get(a.id).timestamp
                );

            if (unreadProfiles.length === 0) {
                usersContainer.innerHTML =
                    `<div class="chat-list-empty">No unread messages</div>`;
                return;
            }

            unreadProfiles.forEach(user => { 
 
                const item = 
                    document.createElement("div"); 
 
                item.className = 
                    "user-item"; 
 
                const firstLetter = 
                    ( 
                        user.username || 
                        user.name || 
                        "U" 
                    ) 
                    .charAt(0) 
                    .toUpperCase(); 
 
                const activity = conversationActivity.get(user.id);
                item.classList.add("has-unread");
                item.innerHTML = ` 
 
                    <div class="user-avatar"> 
                        ${firstLetter} 
                    </div> 
 
                    <div class="user-details"> 
 
                        <strong> 
                            ${escapeHTML( 
                                user.username || "user" 
                            )} 
                        </strong> 
 
                        <small class="chat-row-preview">
                            ${escapeHTML(activity.preview)}
                        </small>

                    </div> 

                    <span class="chat-row-meta">
                        <time>${escapeHTML(formatMessageTime(activity.createdAt))}</time>
                        ${activity.unreadCount
                            ? `<span class="unread-count">${activity.unreadCount}</span>`
                            : ""}
                    </span>
 
                `; 
 
                item.addEventListener( 
                    "click", 
                    () => selectUser(user) 
                ); 
 
                usersContainer.appendChild(item); 
 
            }); 
 
            return; 
        } 


        // ========================= 
        // GROUPS 
        // ========================= 
 
        if (filter === "groups") { 

            if (groupsSection) { 
                groupsSection.style.display = "block"; 
            } 

            userList.style.display = "block"; 
 
            usersContainer.style.display = "none"; 

            document.querySelector(".section-title").style.display = "none"; 
 
            const userSearchBox = 
                document.getElementById("userSearchInput"); 
 
            if (userSearchBox) { 
                userSearchBox.parentElement.style.display = "none"; 
            } 

            const userSectionTitle =
                document.querySelector(".section-title");
            if (userSectionTitle) {
                userSectionTitle.style.display = "none";
            }
 
            if (groupsTitle) { 
                groupsTitle.style.display = "block"; 
            } 
 
            if (groupsContainer) { 
                groupsContainer.style.display = "block"; 
            } 
 
            if (createGroupBtn) { 
                createGroupBtn.style.display = "block"; 
            } 

            await loadGroups(requestId);
 
            return; 
        } 
 
    }); 
 
}); 


// =========================
// CREATE GROUP
// =========================


// =========================
// GROUP MEMBERS + ADD MEMBER
// =========================

const addMemberPanel =
    document.getElementById("addMemberPanel");

const addMemberContainer =
    document.getElementById("addMemberContainer");


async function loadGroupMembersPanel(membersOnly = false) {

    if (!selectedGroup || !currentUser) {
        return;
    }

    if (!addMemberContainer) {
        return;
    }

    addMemberContainer.innerHTML =
        `<div class="loading">Loading members...</div>`;


    // =========================
    // LOAD GROUP MEMBERS
    // =========================

    const {
    data: members,
    error: membersError
} = await supabaseClient
    .from("group_members")
    .select(`
        id,
        user_id,
        joined_at
    `)
        .eq("group_id", selectedGroup.id)
        .order("joined_at", {
            ascending: true
        });


    if (membersError) {

        console.error(
            "Load group members error:",
            membersError
        );

        addMemberContainer.innerHTML =
            `<div class="loading">
                Unable to load members
            </div>`;

        return;
    }

    groupMemberProfiles = [];
    groupMemberProfileGroupId = selectedGroup.id;

    addMemberContainer.innerHTML = "";


    // =========================
    // MEMBERS TITLE
    // =========================

    const membersTitle =
        document.createElement("div");

    membersTitle.style.fontWeight =
        "bold";

    membersTitle.style.marginBottom =
        "10px";

    membersTitle.textContent =
        "👥 Group Members";

    addMemberContainer.appendChild(
        membersTitle
    );


    // =========================
    // SHOW MEMBERS
    // =========================


for (const member of (members || [])) {

    const { data: user, error: userError } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                name,
                avatar_idx
            `)
            .eq("id", member.user_id)
            .maybeSingle();


    if (userError) {

        console.error(
            "Load member profile error:",
            userError
        );

        continue;
    }


    if (!user) {
        continue;
    }

    groupMemberProfiles.push({
        userId: user.id,
        username: user.username || "",
        name: user.name || ""
    });

    const item =
        document.createElement("div");

    item.className =
        "user-item";


    const firstLetter =
        (
            user.username ||
            user.name ||
            "U"
        )
            .charAt(0)
            .toUpperCase();


    const isAdmin =
        selectedGroup.created_by ===
        user.id;


    item.innerHTML = `
        <div class="user-avatar">
            ${firstLetter}
        </div>

        <div class="user-details">

            <strong>
                ${escapeHTML(
                    user.username || "user"
                )}
            </strong>

            <small>
                ${escapeHTML(
                    user.name || ""
                )}
            </small>

            ${
                isAdmin
                    ? `
                        <small style="color:#777;">
                            👑 Admin
                        </small>
                      `
                    : `
                        <small style="color:#777;">
                            👤 Member
                        </small>
                      `
            }

        </div>
    `;


    // =========================
    // REMOVE BUTTON
    // =========================

    if (
        selectedGroup.created_by ===
        currentUser.id
        &&
        user.id !== currentUser.id
    ) {

        const removeBtn =
            document.createElement("button");

        removeBtn.type =
            "button";

        removeBtn.className =
            "add-user-btn";

        removeBtn.textContent =
            "Remove";

        removeBtn.style.background =
            "#e74c3c";


        removeBtn.addEventListener(
            "click",
            async function (event) {

                event.stopPropagation();


                const confirmRemove =
                    confirm(
                        "Remove @" +
                        (
                            user.username ||
                            user.name ||
                            "this user"
                        ) +
                        " from the group?"
                    );


                if (!confirmRemove) {
                    return;
                }


                removeBtn.disabled =
                    true;

                removeBtn.textContent =
                    "Removing...";


                const {
                    error
                } = await supabaseClient
                    .from("group_members")
                    .delete()
                    .eq(
                        "group_id",
                        selectedGroup.id
                    )
                    .eq(
                        "user_id",
                        user.id
                    );


                if (error) {

                    console.error(
                        "Remove member error:",
                        error
                    );

                    alert(
                        "Remove member failed: " +
                        error.message
                    );

                    removeBtn.disabled =
                        false;

                    removeBtn.textContent =
                        "Remove";

                    return;
                }


                alert(
                    "Member removed successfully. 👤"
                );


                await loadGroupMembersPanel();

            }
        );


        item.appendChild(
            removeBtn
        );

    }


    addMemberContainer.appendChild(
        item
    );

}
    // =========================
    // SEPARATOR
    // =========================

    if (membersOnly) {
        return;
    }

    const separator =
        document.createElement("hr");

    separator.style.margin =
        "15px 0";

    addMemberContainer.appendChild(
        separator
    );


    // =========================
    // ADD NEW MEMBERS TITLE
    // =========================

    const addTitle =
        document.createElement("div");

    addTitle.style.fontWeight =
        "bold";

    addTitle.style.marginBottom =
        "10px";

    addTitle.textContent =
        "➕ Add New Members";

    addMemberContainer.appendChild(
        addTitle
    );


    // =========================
    // CURRENT MEMBER IDS
    // =========================

    const memberIds =
        (members || [])
            .map(
                member =>
                    member.user_id
            );


    // =========================
    // LOAD ALL USERS
    // =========================

    const {
        data: users,
        error: usersError
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username, name, avatar_idx"
        )
        .neq(
            "id",
            currentUser.id
        )
        .order(
            "username",
            {
                ascending: true
            }
        );


    if (usersError) {

        console.error(
            "Load available users error:",
            usersError
        );

        return;
    }


    // =========================
    // FILTER NON-MEMBERS
    // =========================

    const availableUsers =
        (users || []).filter(
            user =>
                !memberIds.includes(
                    user.id
                )
        );


    if (
        availableUsers.length === 0
    ) {

        const noUsers =
            document.createElement("div");

        noUsers.className =
            "loading";

        noUsers.textContent =
            "No users available to add.";

        addMemberContainer.appendChild(
            noUsers
        );

        return;
    }


    // =========================
    // SHOW AVAILABLE USERS
    // =========================

    availableUsers.forEach(user => {

        const item =
            document.createElement("div");

        item.className =
            "user-item";


        const firstLetter =
            (
                user.username ||
                user.name ||
                "U"
            )
                .charAt(0)
                .toUpperCase();


        item.innerHTML = `
            <div class="user-avatar">
                ${firstLetter}
            </div>

            <div class="user-details">

                <strong>
                    ${escapeHTML(
                        user.username ||
                        "user"
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        user.name || ""
                    )}
                </small>

            </div>

            <button
                class="add-user-btn"
                type="button"
            >
                Add
            </button>
        `;


        const addBtn =
            item.querySelector(
                ".add-user-btn"
            );


        addBtn.addEventListener(
            "click",
            async function (event) {

                event.stopPropagation();


                addBtn.disabled =
                    true;

                addBtn.textContent =
                    "Adding...";


                const {
                    error
                } = await supabaseClient
                    .from("group_members")
                    .insert({
                        group_id:
                            selectedGroup.id,

                        user_id:
                            user.id
                    });


                if (error) {

                    console.error(
                        "Add member error:",
                        error
                    );

                    alert(
                        "Add member failed: " +
                        error.message
                    );

                    addBtn.disabled =
                        false;

                    addBtn.textContent =
                        "Add";

                    return;
                }


                addBtn.textContent =
                    "Added ✓";

                item.style.opacity =
                    "0.6";


                // Reload members
                await loadGroupMembersPanel();

            }
        );


        addMemberContainer.appendChild(
            item
        );

    });

}


// =========================
// OPEN MEMBER PANEL
// =========================

if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        async function () {

            if (!selectedGroup) {

                alert(
                    "Please select a group."
                );

                return;
            }


            // =========================
            // ADMIN SECURITY CHECK
            // =========================

            if (
                selectedGroup.created_by !==
                currentUser.id
            ) {

                alert(
                    "Only the group admin can manage members."
                );

                return;
            }


            if (
                !addMemberPanel ||
                !addMemberContainer
            ) {
                return;
            }

            showGroupScreen("people");

        }
    );

}

// =========================
// EDIT GROUP NAME
// =========================

if (editGroupBtn) {

    editGroupBtn.addEventListener(
        "click",
        async function () {

            if (!selectedGroup) {
                alert("Please select a group.");
                return;
            }


            // Admin security check
            if (
                selectedGroup.created_by !==
                currentUser.id
            ) {

                alert(
                    "Only the group admin can edit the group."
                );

                return;
            }


            const oldName =
                selectedGroup.name || "";


            const useGroupEditScreen =
                pendingGroupName !== null;
            const newName =
                useGroupEditScreen
                    ? pendingGroupName
                    : prompt(
                        "Enter new group name:",
                        oldName
                    );
            pendingGroupName = null;


            if (newName === null) {
                return;
            }


            const trimmedName =
                newName.trim();


            if (!trimmedName) {

                alert(
                    "Group name cannot be empty."
                );

                return;
            }


            if (trimmedName === oldName) {
                if (useGroupEditScreen) {
                    showGroupScreen("info");
                }
                return;
            }

            if (trimmedName.length > 100) {
                alert("Group name must be 100 characters or fewer.");
                return;
            }

            editGroupBtn.disabled =
                true;


            const {
                data,
                error
            } = await supabaseClient
                .from("groups")
                .update({
                    name: trimmedName
                })
                .eq(
                    "id",
                    selectedGroup.id
                )
                .eq(
                    "created_by",
                    currentUser.id
                )
                .select()
                .single();


            editGroupBtn.disabled =
                false;


            if (error) {

                console.error(
                    "Update group name error:",
                    error
                );

                alert(
                    "Group name update failed: " +
                    error.message
                );

                return;
            }


            selectedGroup.name =
                data.name;
            updateGroupScreenSummary();


            // Update header
            const chatTitle =
                document.getElementById(
                    "chatTitle"
                );

            if (chatTitle) {
                chatTitle.textContent =
                    data.name;
            }

            if (chatUsername) {
                chatUsername.textContent = data.name;
            }

            // Reload group list
            await loadGroups();

            if (useGroupEditScreen) {
                showGroupScreen("info");
            }

            alert(
                "Group name updated successfully. ✅"
            );

        }
    );

}

const createGroupBtn = 
    document.getElementById("createGroupBtn");


if (createGroupBtn) {

    createGroupBtn.addEventListener("click", () => {
        if (newChatScreen && !newChatScreen.hidden) {
            closeNewChatScreen();
        }
    });

    createGroupBtn.addEventListener("click", async function () {

        if (!currentUser) {
            alert("Please login again.");
            return;
        }

        const groupName = prompt("Enter group name:");

        if (!groupName || !groupName.trim()) {
            return;
        }

        createGroupBtn.disabled = true;

        const { data: group, error: groupError } =
            await supabaseClient
                .from("groups")
                .insert({
                    name: groupName.trim(),
                    created_by: currentUser.id
                })
                .select()
                .single();

        if (groupError) {

            console.error(
                "Create group error:",
                groupError
            );

            alert(
                "Group create failed: " +
                groupError.message
            );

            createGroupBtn.disabled = false;
            return;
        }

        // Add creator as first member
        const { error: memberError } =
            await supabaseClient
                .from("group_members")
                .insert({
                    group_id: group.id,
                    user_id: currentUser.id
                });

        if (memberError) {

            console.error(
                "Add group member error:",
                memberError
            );

            alert(
                "Group created, but member add failed: " +
                memberError.message
            );

            createGroupBtn.disabled = false;
            return;
        }

        alert("Group created successfully! 🎉");

        createGroupBtn.disabled = false;

        await loadGroups();
    });

}


// =========================
// LOAD GROUP MESSAGES
// =========================

async function loadGroupMessages() {

    if (!currentUser || !selectedGroup) {
        return;
    }

    chatArea.innerHTML =
        `<div class="loading">Loading group messages...</div>`;

    const { data, error } =
        await supabaseClient
            .from("group_messages")
            .select(`
                id,
                group_id,
                sender_id,
                text,
                created_at
            `)
            .eq("group_id", selectedGroup.id)
            .order("created_at", {
                ascending: true
            });

    if (error) {

        console.error(
            "Load group messages error:",
            error
        );

        chatArea.innerHTML =
            `<div class="loading">
                Unable to load group messages
            </div>`;

        return;
    }

    chatArea.innerHTML = "";

    if (!data || data.length === 0) {

        chatArea.innerHTML =
            `<div class="no-chat">
                No messages yet. Say hello 👋
            </div>`;

        return;
    }

    data.forEach(message => {

        const messageElement =
            document.createElement("div");

        const isMine =
            message.sender_id === currentUser.id;

        messageElement.className =
            isMine
                ? "message my-message"
                : "message other-message";

        messageElement.dataset.messageId =
            message.id;

        messageElement.innerHTML = `
            <div class="message-text">
                ${escapeHTML(message.text || "")}
            </div>

            <div class="message-time">
                ${formatMessageTime(
                    message.created_at
                )}
            </div>
        `;

        chatArea.appendChild(messageElement);

    });

    scrollToBottom();
}


// =========================
// SEND GROUP MESSAGE
// =========================

async function sendGroupMessage() {

    if (!currentUser) {
        alert("Please login again.");
        return;
    }

    if (!selectedGroup) {
        alert("Please select a group.");
        return;
    }

    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    sendBtn.disabled = true;

    const { data, error } =
        await supabaseClient
            .from("group_messages")
            .insert({
                group_id: selectedGroup.id,
                sender_id: currentUser.id,
                text: message
            })
            .select()
            .single();

    sendBtn.disabled = false;

    if (error) {

        console.error(
            "Send group message error:",
            error
        );

        alert(
            "Group message send failed: " +
            error.message
        );

        return;
    }

    messageInput.value = "";

    if (data) {

        const existingMessage =
            document.querySelector(
                `[data-message-id="${data.id}"]`
            );

        if (!existingMessage) {

            removeNoChatMessage();

            const messageElement =
                document.createElement("div");

            const isMine =
                data.sender_id === currentUser.id;

            messageElement.className =
                isMine
                    ? "message my-message"
                    : "message other-message";

            messageElement.dataset.messageId =
                data.id;

            messageElement.innerHTML = `
                <div class="message-text">
                    ${escapeHTML(data.text || "")}
                </div>

                <div class="message-time">
                    ${formatMessageTime(
                        data.created_at
                    )}
                </div>
            `;

            chatArea.appendChild(messageElement);

            scrollToBottom();
        }
    }
}


// =========================
// LOAD GROUPS
// =========================

async function loadGroups(requestId = null) {

    const groupsContainer =
        document.getElementById("groupsContainer");

    if (!groupsContainer || !currentUser) {
        return;
    }

    groupsContainer.innerHTML =
        `<div class="loading">Loading groups...</div>`;

    const { data, error } =
        await supabaseClient
            .from("groups")
            .select(`
                id,
                name,
                avatar_url,
                created_by,
                created_at
            `)
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Load groups error:",
            error
        );

        groupsContainer.innerHTML =
            `<div class="loading">
                Unable to load groups
            </div>`;

        return;
    }

    if (requestId !== null && requestId !== chatListFilterRequest) {
        return;
    }

    const { data: memberships, error: membershipError } =
        await supabaseClient
            .from("group_members")
            .select("group_id")
            .eq("user_id", currentUser.id);

    if (membershipError) {
        console.error("Load joined groups error:", membershipError);
        groupsContainer.innerHTML =
            `<div class="loading">Unable to load joined groups</div>`;
        return;
    }

    if (requestId !== null && requestId !== chatListFilterRequest) {
        return;
    }

    const joinedGroupIds = new Set(
        (memberships || []).map(member => member.group_id)
    );
    const joinedGroups = (data || []).filter(group =>
        joinedGroupIds.has(group.id)
    );

    if (joinedGroups.length === 0) {

        groupsContainer.innerHTML =
            `<div class="no-groups">
                No groups yet
            </div>`;

        return;
    }

    const groupActivity = new Map();
    const { data: groupMessages, error: groupMessagesError } =
        await supabaseClient
            .from("group_messages")
            .select("group_id, sender_id, text, created_at")
            .in("group_id", Array.from(joinedGroupIds))
            .order("created_at", { ascending: false })
            .limit(1000);

    if (groupMessagesError && joinedGroupIds.size > 0) {
        console.error("Load group list activity error:", groupMessagesError);
    } else {
        (groupMessages || []).forEach(message => {
            if (!groupActivity.has(message.group_id)) {
                groupActivity.set(message.group_id, {
                    timestamp: Date.parse(message.created_at) || 0,
                    createdAt: message.created_at,
                    preview: `${message.sender_id === currentUser.id ? "You: " : ""}${message.text || ""}`
                });
            }
        });
    }

    if (requestId !== null && requestId !== chatListFilterRequest) {
        return;
    }

    groupsContainer.innerHTML = "";

    joinedGroups
        .sort((a, b) =>
            (groupActivity.get(b.id)?.timestamp || 0) -
            (groupActivity.get(a.id)?.timestamp || 0)
        )
        .forEach(group => {

        const item =
            document.createElement("div");

        item.className =
            "group-item";


        // =========================
        // GROUP LIST AVATAR
        // =========================

        const firstLetter =
            (group.name || "G")
                .charAt(0)
                .toUpperCase();

        const groupAvatarHTML =
            group.avatar_url
                ? `
                    <img
                        src="${escapeHTML(group.avatar_url)}"
                        alt="Group"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >
                  `
                : firstLetter;


        item.innerHTML = `

            <div class="group-avatar">
                ${groupAvatarHTML}
            </div>

            <div class="group-details">

                <strong>
                    ${escapeHTML(
                        group.name || "Group"
                    )}
                </strong>

                <small class="chat-row-preview">
                    ${escapeHTML(groupActivity.get(group.id)?.preview || "Group")}
                </small>

            </div>

            <span class="chat-row-meta">
                ${groupActivity.get(group.id)?.createdAt
                    ? `<time>${escapeHTML(formatMessageTime(groupActivity.get(group.id).createdAt))}</time>`
                    : ""}
                <span class="group-row-label">Group</span>
            </span>

        `;


        item.addEventListener("click", async function () {

            selectedGroup = group;
            selectedUser = null;
            document.body.classList.add("chat-view-active");
            document.body.classList.add("group-chat-active");
            setGroupHeaderActionable(true);
            if (groupSettingsPanel) {
                groupSettingsPanel.style.display = "none";
                groupSettingsPanel.setAttribute("aria-hidden", "true");
            }
            if (addMemberPanel) addMemberPanel.style.display = "none";

            startGroupTypingCheck();


            if (addMemberBtn) {
    addMemberBtn.style.display =
        group.created_by === currentUser.id
            ? "flex"
            : "none";
}

            if (leaveGroupBtn) {
                leaveGroupBtn.style.display = "flex";
            }

            if (inviteGroupBtn) {
                inviteGroupBtn.style.display = "flex";
            }

            if (changeGroupAvatarBtn) {
                changeGroupAvatarBtn.style.display =
                    group.created_by === currentUser.id
                        ? "flex"
                        : "none";
            }
if (editGroupBtn) {
    editGroupBtn.style.display =
        group.created_by === currentUser.id
            ? "flex"
            : "none";
}

if (groupSettingsBtn) {
    groupSettingsBtn.style.display =
        group.created_by === currentUser.id
            ? "flex"
            : "none";
}

            subscribeToGroupMessages();


            chatUsername.textContent =
                group.name || "Group";


            // =========================
            // GROUP HEADER AVATAR
            // =========================

            if (group.avatar_url) {

                chatAvatar.innerHTML = `
                    <img
                        src="${escapeHTML(group.avatar_url)}"
                        alt="Group"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >
                `;

            } else {

                chatAvatar.textContent =
                    (group.name || "G")
                        .charAt(0)
                        .toUpperCase();
            }


            chatStatus.textContent =
                "👥 Group chat";


            userList.style.display = "none";

            messageBox.style.display = "flex";


            chatArea.innerHTML = `
                <div class="loading">
                    Loading group messages...
                </div>
            `;


            await loadGroupMessages();

        });


        groupsContainer.appendChild(item);

    });
}


// =========================
// ENTER KEY
// =========================

if (messageInput) {

    messageInput.addEventListener("keydown", function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            if (selectedGroup) {

                sendGroupMessage();

            } else if (selectedUser) {

                sendMessage();

            }

        }

    });

}


// =========================
// START APP
// =========================

startChat();


// =========================
// LEAVE GROUP
// =========================

if (leaveGroupBtn) {

    leaveGroupBtn.addEventListener("click", async function () {

        if (!currentUser) {
            alert("Please login again.");
            return;
        }

        if (!selectedGroup) {
            alert("Please select a group.");
            return;
        }

        const confirmLeave = confirm(
            "Are you sure you want to leave this group?"
        );

        if (!confirmLeave) {
            return;
        }

        const { error } = await supabaseClient
            .from("group_members")
            .delete()
            .eq("group_id", selectedGroup.id)
            .eq("user_id", currentUser.id);

        if (error) {

            console.error(
                "Leave group error:",
                error
            );

            alert(
                "Unable to leave group: " +
                error.message
            );

            return;
        }


        alert("You have left the group.");


        if (groupRealtimeChannel) {

            supabaseClient.removeChannel(
                groupRealtimeChannel
            );

            groupRealtimeChannel = null;
        }


        selectedGroup = null;
        selectedUser = null;
        document.body.classList.remove("chat-view-active");
        document.body.classList.remove("group-chat-active");
        setGroupHeaderActionable(false);
        if (groupSettingsPanel) {
            groupSettingsPanel.style.display = "none";
            groupSettingsPanel.setAttribute("aria-hidden", "true");
        }


        if (addMemberBtn) {
            addMemberBtn.style.display = "none";
        }

        if (leaveGroupBtn) {
            leaveGroupBtn.style.display = "none";
        }

        if (inviteGroupBtn) {
            inviteGroupBtn.style.display = "none";
        }

        if (changeGroupAvatarBtn) {
            changeGroupAvatarBtn.style.display = "none";
        }


        messageBox.style.display = "none";

        userList.style.display = "block";


        chatUsername.textContent =
            "Select user";

        chatStatus.textContent =
            "inware";

        chatAvatar.textContent =
            "U";


        chatArea.innerHTML = `
            <div class="no-chat">
                Select a user or group to start chatting 💬
            </div>
        `;


        await loadGroups();

    });

}


// =========================
// INVITE GROUP
// =========================

if (inviteGroupBtn) {

    inviteGroupBtn.addEventListener("click", async function () {

        if (!currentUser) {
            alert("Please login again.");
            return;
        }

        if (!selectedGroup) {
            alert("Please select a group.");
            return;
        }

        const inviteLink =
            window.location.origin +
            window.location.pathname +
            "?group=" +
            selectedGroup.id;

        try {

            await navigator.clipboard.writeText(
                inviteLink
            );

            alert(
                "Group invite link copied! 🔗"
            );

        } catch (error) {

            console.error(
                "Copy invite link error:",
                error
            );

            prompt(
                "Copy this group invite link:",
                inviteLink
            );
        }

    });

}


// =========================
// CHANGE GROUP AVATAR
// =========================

if (changeGroupAvatarBtn && groupAvatarInput) {

    changeGroupAvatarBtn.addEventListener(
        "click",
        function () {

            if (!selectedGroup) {
                alert("Please select a group.");
                return;
            }

            groupAvatarInput.click();
        }
    );


    groupAvatarInput.addEventListener(
        "change",
        async function () {

            const file =
                groupAvatarInput.files[0];

            if (!file) {
                return;
            }

            if (!selectedGroup) {
                alert("Please select a group.");
                return;
            }

            if (!file.type.startsWith("image/")) {
                alert("Please select an image.");
                groupAvatarInput.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Image must be smaller than 5 MB.");
                groupAvatarInput.value = "";
                return;
            }


            changeGroupAvatarBtn.disabled = true;


            const fileName =
                selectedGroup.id +
                "-" +
                Date.now() +
                "-" +
                file.name.replace(
                    /[^a-zA-Z0-9.-]/g,
                    "_"
                );


            const filePath =
                "groups/" + fileName;


            // =========================
            // UPLOAD IMAGE
            // =========================

            const {
                error: uploadError
            } = await supabaseClient
                .storage
                .from("group-avatars")
                .upload(
                    filePath,
                    file,
                    {
                        upsert: false
                    }
                );


            if (uploadError) {

                console.error(
                    "Group avatar upload error:",
                    uploadError
                );

                alert(
                    "Upload failed: " +
                    uploadError.message
                );

                changeGroupAvatarBtn.disabled = false;
                groupAvatarInput.value = "";

                return;
            }


            // =========================
            // GET PUBLIC URL
            // =========================

            const {
                data: publicUrlData
            } = supabaseClient
                .storage
                .from("group-avatars")
                .getPublicUrl(filePath);


            const avatarUrl =
                publicUrlData.publicUrl;


            // =========================
            // SAVE URL IN GROUP TABLE
            // =========================

            const {
                data: updatedGroup,
                error: updateError
            } = await supabaseClient
                .from("groups")
                .update({
                    avatar_url: avatarUrl
                })
                .eq("id", selectedGroup.id)
                .select(`
                    id,
                    name,
                    avatar_url,
                    created_by,
                    created_at
                `)
                .single();


            if (updateError) {

                console.error(
                    "Group avatar update error:",
                    updateError
                );

                alert(
                    "Photo save failed: " +
                    updateError.message
                );

                changeGroupAvatarBtn.disabled = false;
                groupAvatarInput.value = "";

                return;
            }


            // =========================
            // UPDATE SELECTED GROUP
            // =========================

            selectedGroup =
                updatedGroup;
            updateGroupScreenSummary();


            // =========================
            // SHOW PHOTO IMMEDIATELY
            // =========================

            chatAvatar.innerHTML = `
                <img
                    src="${escapeHTML(avatarUrl)}"
                    alt="Group"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                    "
                >
            `;


            alert(
                "Group photo updated! 📷"
            );


            changeGroupAvatarBtn.disabled = false;

            groupAvatarInput.value = "";


            // =========================
            // REFRESH GROUP LIST
            // =========================

            await loadGroups();

        }
    );

}
// =========================
// GROUP SETTINGS PANEL
// =========================

const groupSettingsPanel =
    document.getElementById("groupSettingsPanel");

const directChatInfoPanel =
    document.getElementById("directChatInfoPanel");
const directChatInfoViews = {
    info: document.getElementById("directChatInfoContent"),
    customize: document.getElementById("directChatCustomizeContent"),
    privacy: document.getElementById("directChatPrivacyContent")
};
const directChatScreenTitle =
    document.getElementById("directChatScreenTitle");
const directChatInfoAvatar =
    document.getElementById("directChatInfoAvatar");
const directChatInfoName =
    document.getElementById("directChatInfoName");
const directChatInfoUsername =
    document.getElementById("directChatInfoUsername");
const directChatOptionsMenu =
    document.getElementById("directChatOptionsMenu");
const directChatThemePreview =
    document.getElementById("directChatThemePreview");
const chatSearchInput =
    document.getElementById("chatSearchInput");
const chatSearchCloseBtn =
    document.getElementById("chatSearchCloseBtn");
const activitySearchResults =
    document.getElementById("activitySearchResults");
const chatSearchDefaultPlaceholder =
    chatSearchInput?.placeholder || "Search messages, users, or groups...";
let activitySearchDebounce = null;
let activitySearchRequestId = 0;

const settingsEditNameBtn =
    document.getElementById("settingsEditNameBtn");
const settingsMembersBtn =
    document.getElementById("settingsMembersBtn");
const settingsPhotoBtn =
    document.getElementById("settingsPhotoBtn");
const groupScreenViews = {
    info: document.getElementById("groupInfoContent"),
    edit: document.getElementById("groupEditContent"),
    customize: document.getElementById("groupCustomizeContent"),
    privacy: document.getElementById("groupPrivacyContent"),
    nicknames: document.getElementById("groupNicknamesContent"),
    people: document.getElementById("groupPeopleContent")
};
let activeGroupScreen = "chat";
let groupMemberProfileGroupId = null;
let activeDirectChatScreen = "chat";

function getDirectChatSettingsKey() {
    if (!currentUser || !selectedUser) return null;
    return `inware.direct-chat.${currentUser.id}.${selectedUser.id}`;
}

function getDirectChatPreferences() {
    const defaults = { theme: "default", font: "default" };
    const key = getDirectChatSettingsKey();
    if (!key) return defaults;

    try {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return {
            theme: ["default", "light", "dark", "soft", "ocean", "sunset"].includes(saved.theme)
                ? saved.theme
                : defaults.theme,
            font: ["default", "serif", "rounded", "mono"].includes(saved.font)
                ? saved.font
                : defaults.font
        };
    } catch {
        return defaults;
    }
}

function saveDirectChatPreference(name, value) {
    const key = getDirectChatSettingsKey();
    if (!key) return;

    const preferences = getDirectChatPreferences();
    preferences[name] = value;
    try {
        localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
        // Keep the current selection active when local storage is unavailable.
    }
    applyDirectChatPreferences();
}

function applyDirectChatPreferences() {
    if (!selectedUser || selectedGroup) return;
    const preferences = getDirectChatPreferences();
    [chatArea, messageBox].forEach(element => {
        if (!element) return;
        if (preferences.theme === "default") {
            delete element.dataset.chatTheme;
        } else {
            element.dataset.chatTheme = preferences.theme;
        }
        if (preferences.font === "default") {
            delete element.dataset.chatFont;
        } else {
            element.dataset.chatFont = preferences.font;
        }
    });

    document.querySelectorAll("[data-direct-chat-theme]").forEach(option => {
        option.setAttribute("aria-pressed", String(option.dataset.directChatTheme === preferences.theme));
    });
    document.querySelectorAll("[data-direct-chat-font]").forEach(option => {
        option.setAttribute("aria-pressed", String(option.dataset.directChatFont === preferences.font));
    });
    if (directChatThemePreview) {
        directChatThemePreview.dataset.chatTheme = preferences.theme;
    }
}

function updateDirectChatInfoSummary() {
    if (!selectedUser) return;
    const displayName = selectedUser.name || selectedUser.username || "User";
    if (directChatInfoName) directChatInfoName.textContent = displayName;
    if (directChatInfoUsername) {
        directChatInfoUsername.textContent = selectedUser.username
            ? `@${selectedUser.username}`
            : "";
    }
    if (directChatInfoAvatar) {
        directChatInfoAvatar.textContent = displayName.charAt(0).toUpperCase();
    }
}

function showDirectChatScreen(screen) {
    if (
        !selectedUser || selectedGroup || !directChatInfoPanel ||
        !directChatInfoViews[screen]
    ) return;

    closeDirectChatSearch(false);
    activeDirectChatScreen = screen;
    directChatInfoPanel.style.display = "flex";
    directChatInfoPanel.setAttribute("aria-hidden", "false");
    if (directChatOptionsMenu) directChatOptionsMenu.hidden = true;
    Object.entries(directChatInfoViews).forEach(([name, view]) => {
        if (view) view.hidden = name !== screen;
    });

    const titles = {
        info: "Chat Info",
        customize: "Customize",
        privacy: "Privacy & safety"
    };
    if (directChatScreenTitle) directChatScreenTitle.textContent = titles[screen];
    updateDirectChatInfoSummary();
    applyDirectChatPreferences();
}

function openDirectChatInfo() {
    if (!selectedUser || selectedGroup) return;
    showDirectChatScreen("info");
}

function closeDirectChatInfo() {
    if (!directChatInfoPanel) return;
    directChatInfoPanel.style.display = "none";
    directChatInfoPanel.setAttribute("aria-hidden", "true");
    activeDirectChatScreen = "chat";
}

function handleDirectChatInfoBack() {
    if (activeDirectChatScreen === "info") {
        closeDirectChatInfo();
    } else {
        showDirectChatScreen("info");
    }
}

function applyDirectChatMessageSearch() {
    if (!selectedUser || selectedGroup || !document.body.classList.contains("direct-chat-search-active")) {
        return;
    }
    const query = (chatSearchInput?.value || "").trim().toLowerCase();
    chatArea.querySelectorAll(".message").forEach(message => {
        message.hidden = Boolean(query) && !message.textContent.toLowerCase().includes(query);
    });
}

function openDirectChatSearch() {
    if (!selectedUser || selectedGroup) return;
    closeDirectChatInfo();
    document.body.classList.add("direct-chat-search-active");
    if (chatSearchInput) {
        chatSearchInput.placeholder = "Search messages in this conversation...";
        chatSearchInput.value = "";
        chatSearchInput.focus();
    }
    if (chatSearchCloseBtn) chatSearchCloseBtn.hidden = false;
    applyDirectChatMessageSearch();
}

function closeDirectChatSearch(returnToInfo = true) {
    if (!document.body.classList.contains("direct-chat-search-active")) return;
    document.body.classList.remove("direct-chat-search-active");
    if (chatSearchInput) {
        chatSearchInput.value = "";
        chatSearchInput.placeholder = chatSearchDefaultPlaceholder;
    }
    if (chatSearchCloseBtn) chatSearchCloseBtn.hidden = true;
    chatArea?.querySelectorAll(".message").forEach(message => {
        message.hidden = false;
    });
    if (returnToInfo && selectedUser && !selectedGroup) {
        openDirectChatInfo();
    }
}

function resetActivitySearch() {
    clearTimeout(activitySearchDebounce);
    activitySearchRequestId += 1;
    document.body.classList.remove("main-chat-search-open");
    if (activitySearchResults) {
        activitySearchResults.hidden = true;
        activitySearchResults.replaceChildren();
    }
    if (chatSearchCloseBtn) chatSearchCloseBtn.hidden = true;
}

function handleActivitySearchInput() {
    if (document.body.classList.contains("chat-view-active")) return;
    const query = (chatSearchInput?.value || "").trim();
    if (!query) {
        resetActivitySearch();
        return;
    }

    document.body.classList.add("main-chat-search-open");
    if (activitySearchResults) {
        activitySearchResults.hidden = false;
        activitySearchResults.innerHTML = `<div class="activity-search-empty">Searching...</div>`;
    }
    if (chatSearchCloseBtn) chatSearchCloseBtn.hidden = false;

    clearTimeout(activitySearchDebounce);
    const requestId = ++activitySearchRequestId;
    activitySearchDebounce = setTimeout(() => {
        runActivitySearch(query, requestId);
    }, 250);
}

async function runActivitySearch(query, requestId) {
    if (!currentUser || !activitySearchResults) return;
    const [eligibleUsers, messageResult] = await Promise.all([
        getConnectedChatUsers(),
        supabaseClient
            .from("messages")
            .select("id, sender_id, receiver_id, text, created_at")
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .ilike("text", `%${query}%`)
            .order("created_at", { ascending: false })
            .limit(40)
    ]);

    if (
        requestId !== activitySearchRequestId ||
        document.body.classList.contains("chat-view-active") ||
        !document.body.classList.contains("main-chat-search-open")
    ) return;

    if (messageResult.error) {
        console.error("Activity message search error:", messageResult.error);
    }

    const normalizedQuery = query.toLowerCase();
    const people = eligibleUsers
        .filter(user =>
            (user.username || "").toLowerCase().includes(normalizedQuery) ||
            (user.name || "").toLowerCase().includes(normalizedQuery)
        )
        .slice(0, 20);
    const eligibleById = new Map(eligibleUsers.map(user => [user.id, user]));
    const messages = (messageResult.data || []).flatMap(message => {
        const peerId = message.sender_id === currentUser.id
            ? message.receiver_id
            : message.sender_id;
        const peer = eligibleById.get(peerId);
        return peer ? [{ ...message, peer }] : [];
    });

    renderActivitySearchResults(people, messages);
}

function createActivitySearchResult(user, secondaryText, metaText, onClick, isMessage = false) {
    const result = document.createElement("button");
    result.type = "button";
    result.className = "activity-search-result";

    const avatar = document.createElement("span");
    avatar.className = "user-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = (user.username || user.name || "U").charAt(0).toUpperCase();

    const details = document.createElement("span");
    details.className = "activity-search-result-details";
    const name = document.createElement("strong");
    name.textContent = user.name || user.username || "User";
    details.appendChild(name);

    const secondary = document.createElement("small");
    secondary.className = isMessage ? "activity-search-message-text" : "";
    secondary.textContent = secondaryText;
    details.appendChild(secondary);

    const meta = document.createElement("time");
    meta.className = "activity-search-result-meta";
    meta.textContent = metaText || "";
    result.append(avatar, details, meta);
    result.addEventListener("click", onClick);
    return result;
}

function renderActivitySearchResults(people, messages) {
    if (!activitySearchResults) return;
    activitySearchResults.replaceChildren();
    if (people.length === 0 && messages.length === 0) {
        const empty = document.createElement("div");
        empty.className = "activity-search-empty";
        empty.textContent = "No results found";
        activitySearchResults.appendChild(empty);
        return;
    }

    if (people.length > 0) {
        const title = document.createElement("h2");
        title.className = "activity-search-section-title";
        title.textContent = "People";
        activitySearchResults.appendChild(title);

        people.forEach(user => {
            const handle = user.username ? `@${user.username}` : "Connected user";
            const result = createActivitySearchResult(user, handle, "", async event => {
                const button = event.currentTarget;
                button.disabled = true;
                if (!await canStartDirectChatWith(user.id)) {
                    button.disabled = false;
                    showToast("You can only start chats with people you are connected with.");
                    return;
                }
                resetActivitySearch();
                if (chatSearchInput) chatSearchInput.value = "";
                await selectUser(user);
            });
            activitySearchResults.appendChild(result);
        });
    }

    if (messages.length > 0) {
        const title = document.createElement("h2");
        title.className = "activity-search-section-title";
        title.textContent = "Messages";
        activitySearchResults.appendChild(title);

        messages.forEach(message => {
            const peer = message.peer;
            const preview = (message.text || "").trim();
            const result = createActivitySearchResult(
                peer,
                preview.length > 120 ? `${preview.slice(0, 117)}...` : preview,
                formatMessageTime(message.created_at),
                async event => {
                    const button = event.currentTarget;
                    button.disabled = true;
                    if (!await canStartDirectChatWith(peer.id)) {
                        button.disabled = false;
                        showToast("You can only open messages with people you are connected with.");
                        return;
                    }
                    resetActivitySearch();
                    if (chatSearchInput) chatSearchInput.value = "";
                    await selectUser(peer);
                    await new Promise(resolve => setTimeout(resolve, 250));
                    if (!selectedUser || selectedUser.id !== peer.id) return;
                    const target = [...chatArea.querySelectorAll(".message")]
                        .find(element => element.dataset.messageId === String(message.id));
                    if (!target) return;
                    target.classList.add("search-result-highlight");
                    const areaTop = chatArea.getBoundingClientRect().top;
                    const targetTop = target.getBoundingClientRect().top - areaTop + chatArea.scrollTop;
                    const previousScrollBehavior = chatArea.style.scrollBehavior;
                    chatArea.style.scrollBehavior = "auto";
                    chatArea.scrollTop = Math.max(
                        0,
                        targetTop - (chatArea.clientHeight - target.offsetHeight) / 2
                    );
                    requestAnimationFrame(() => {
                        chatArea.style.scrollBehavior = previousScrollBehavior;
                    });
                    setTimeout(() => target.classList.remove("search-result-highlight"), 1900);
                },
                true
            );
            activitySearchResults.appendChild(result);
        });
    }
}

function handleChatSearchClear() {
    if (document.body.classList.contains("direct-chat-search-active")) {
        closeDirectChatSearch();
        return;
    }
    if (chatSearchInput) {
        chatSearchInput.value = "";
        chatSearchInput.focus();
    }
    resetActivitySearch();
}

function setDirectChatHeaderActionable(isDirectChat) {
    const identity = document.querySelector(".chat-header .chat-user");
    if (!identity) return;
    if (isDirectChat && selectedUser && !selectedGroup) {
        identity.setAttribute("role", "button");
        identity.setAttribute("tabindex", "0");
        identity.setAttribute("aria-label", "Open chat info");
    } else if (!selectedGroup) {
        identity.removeAttribute("role");
        identity.removeAttribute("tabindex");
        identity.removeAttribute("aria-label");
    }
}

document.getElementById("directChatInfoBackBtn")?.addEventListener("click", handleDirectChatInfoBack);
document.getElementById("directChatProfileBtn")?.addEventListener("click", () => {
    if (selectedUser) {
        window.location.href = `profile.html?id=${encodeURIComponent(selectedUser.id)}`;
    }
});
document.getElementById("directChatSearchBtn")?.addEventListener("click", openDirectChatSearch);
document.getElementById("directChatOptionsBtn")?.addEventListener("click", () => {
    if (directChatOptionsMenu) directChatOptionsMenu.hidden = !directChatOptionsMenu.hidden;
});
document.getElementById("directChatCustomizeBtn")?.addEventListener("click", () => {
    showDirectChatScreen("customize");
});
document.getElementById("directChatPrivacyBtn")?.addEventListener("click", () => {
    showDirectChatScreen("privacy");
});
document.querySelectorAll("[data-direct-chat-theme]").forEach(option => {
    option.addEventListener("click", () => {
        saveDirectChatPreference("theme", option.dataset.directChatTheme);
    });
});
document.querySelectorAll("[data-direct-chat-font]").forEach(option => {
    option.addEventListener("click", () => {
        saveDirectChatPreference("font", option.dataset.directChatFont);
    });
});
chatSearchInput?.addEventListener("input", applyDirectChatMessageSearch);
chatSearchInput?.addEventListener("input", handleActivitySearchInput);
chatSearchInput?.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.body.classList.contains("direct-chat-search-active")) {
        closeDirectChatSearch();
    }
});
chatSearchInput?.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        document.body.classList.contains("main-chat-search-open")
    ) {
        event.preventDefault();
        chatSearchInput.value = "";
        resetActivitySearch();
    }
});
chatSearchCloseBtn?.addEventListener("click", handleChatSearchClear);

function setGroupScreenAvatar(element, group) {
    if (!element) {
        return;
    }

    element.replaceChildren();
    if (group && group.avatar_url) {
        const image = document.createElement("img");
        image.src = group.avatar_url;
        image.alt = "";
        element.appendChild(image);
        return;
    }

    element.textContent =
        (group && group.name ? group.name : "G")
            .charAt(0)
            .toUpperCase();
}

function updateGroupScreenSummary() {
    if (!selectedGroup) {
        return;
    }

    const name =
        selectedGroup.name || "Group";
    const nameElement =
        document.getElementById("groupSettingsName");
    const descriptionElement =
        document.getElementById("groupSettingsDescription");
    const editNameInput =
        document.getElementById("groupEditNameInput");
    const isAdmin =
        currentUser &&
        selectedGroup.created_by === currentUser.id;

    if (nameElement) {
        nameElement.textContent = name;
    }
    if (descriptionElement) {
        descriptionElement.textContent = "Group conversation";
    }

    setGroupScreenAvatar(
        document.getElementById("groupSettingsAvatar"),
        selectedGroup
    );
    setGroupScreenAvatar(
        document.getElementById("groupEditAvatar"),
        selectedGroup
    );

    if (editNameInput && activeGroupScreen !== "edit") {
        editNameInput.value = name;
        updateGroupNameCounter();
    }

    if (settingsEditNameBtn) {
        settingsEditNameBtn.hidden = !isAdmin;
    }
    if (settingsPhotoBtn) {
        settingsPhotoBtn.hidden = !isAdmin;
    }
    const addAction = document.getElementById("groupInfoAddBtn");
    if (addAction) {
        addAction.hidden = !isAdmin;
    }
}

function updateGroupNameCounter() {
    const input = document.getElementById("groupEditNameInput");
    const counter = document.getElementById("groupEditNameCount");
    if (input && counter) {
        counter.textContent = `${input.value.length}/100`;
    }
}

function setGroupHeaderActionable(isGroup) {
    const identity =
        document.querySelector(".chat-header .chat-user");
    if (!identity) {
        return;
    }

    if (isGroup) {
        identity.setAttribute("role", "button");
        identity.setAttribute("tabindex", "0");
        identity.setAttribute("aria-label", "Open group info");
    } else {
        identity.removeAttribute("role");
        identity.removeAttribute("tabindex");
        identity.removeAttribute("aria-label");
    }
}

function showGroupScreen(screen) {
    if (!selectedGroup || !groupSettingsPanel || !groupScreenViews[screen]) {
        return;
    }

    activeGroupScreen = screen;
    groupSettingsPanel.style.display = "flex";
    groupSettingsPanel.setAttribute("aria-hidden", "false");
    const optionsMenu = document.getElementById("groupOptionsMenu");
    if (optionsMenu) {
        optionsMenu.hidden = true;
    }
    Object.entries(groupScreenViews).forEach(([name, view]) => {
        if (view) {
            view.hidden = name !== screen;
        }
    });

    const titles = {
        info: "Group info",
        edit: "Edit group",
        customize: "Customize",
        privacy: "Privacy & safety",
        nicknames: "Nicknames",
        people: "People"
    };
    const title = document.getElementById("groupScreenTitle");
    if (title) {
        title.textContent = titles[screen];
    }

    updateGroupScreenSummary();
    const addMemberPanel =
        document.getElementById("addMemberPanel");
    if (addMemberPanel) {
        addMemberPanel.style.display =
            screen === "people" ? "block" : "none";
    }

    if (screen === "edit") {
        const input = document.getElementById("groupEditNameInput");
        if (input) {
            input.value = selectedGroup.name || "";
            updateGroupNameCounter();
            input.focus();
            input.select();
        }
    }

    if (screen === "people") {
        const unavailable =
            document.getElementById("groupPeopleUnavailable");
        const isAdmin =
            currentUser &&
            selectedGroup.created_by === currentUser.id;
        if (unavailable) {
            unavailable.hidden = isAdmin;
        }
        if (addMemberPanel) {
            addMemberPanel.style.display = "block";
        }
        loadGroupMembersPanel(!isAdmin);
    }

    if (screen === "nicknames") {
        if (groupMemberProfileGroupId !== selectedGroup.id) {
            groupMemberProfiles = [];
            const list = document.getElementById("groupNicknamesList");
            if (list) {
                list.replaceChildren();
            }
            loadGroupMembersPanel(true).then(renderGroupNicknames);
        } else {
            renderGroupNicknames();
        }
    }
}

function renderGroupNicknames() {
    const list = document.getElementById("groupNicknamesList");
    if (!list) {
        return;
    }

    list.replaceChildren();
    groupMemberProfiles.forEach(member => {
        const row = document.createElement("div");
        row.className = "group-nickname-row";
        const avatar = document.createElement("span");
        avatar.className = "group-nickname-avatar";
        avatar.textContent =
            (member.username || member.name || "U").charAt(0).toUpperCase();
        const identity = document.createElement("span");
        identity.className = "group-nickname-identity";
        const name = document.createElement("strong");
        name.textContent = member.name || member.username || "Member";
        const username = document.createElement("small");
        username.textContent = `@${member.username || "user"}`;
        identity.append(name, username);
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 40;
        input.placeholder = "Nickname (not saved)";
        input.setAttribute("aria-label", `Nickname for ${member.username || member.name || "member"}`);
        row.append(avatar, identity, input);
        list.appendChild(row);
    });
}

function openGroupInfo() {
    if (!selectedGroup) {
        return;
    }
    showGroupScreen("info");
}

function closeGroupInfo() {
    if (groupSettingsPanel) {
        groupSettingsPanel.style.display = "none";
        groupSettingsPanel.setAttribute("aria-hidden", "true");
    }
    activeGroupScreen = "chat";
}

function handleGroupScreenBack() {
    if (activeGroupScreen === "info") {
        closeGroupInfo();
    } else {
        showGroupScreen("info");
    }
}

const groupScreenBackBtn =
    document.getElementById("groupScreenBackBtn");
if (groupScreenBackBtn) {
    groupScreenBackBtn.addEventListener("click", handleGroupScreenBack);
}

if (groupSettingsBtn) {
    groupSettingsBtn.addEventListener("click", openGroupInfo);
}

const groupHeaderIdentity =
    document.querySelector(".chat-header .chat-user");
if (groupHeaderIdentity) {
    groupHeaderIdentity.addEventListener("click", openGroupInfo);
    groupHeaderIdentity.addEventListener("click", openDirectChatInfo);
    groupHeaderIdentity.addEventListener("keydown", event => {
        if (
            (selectedGroup || (selectedUser && !selectedGroup)) &&
            (event.key === "Enter" || event.key === " ")
        ) {
            event.preventDefault();
            if (selectedGroup) {
                openGroupInfo();
            } else {
                openDirectChatInfo();
            }
        }
    });
}

if (settingsEditNameBtn) {
    settingsEditNameBtn.addEventListener("click", () => {
        if (!selectedGroup || !currentUser ||
            selectedGroup.created_by !== currentUser.id) {
            return;
        }
        showGroupScreen("edit");
    });
}

if (settingsPhotoBtn) {
    settingsPhotoBtn.addEventListener("click", () => {
        if (!selectedGroup || !currentUser ||
            selectedGroup.created_by !== currentUser.id) {
            alert("Only the group admin can change the group photo.");
            return;
        }
        if (groupAvatarInput) {
            groupAvatarInput.click();
        }
    });
}

if (settingsMembersBtn) {
    settingsMembersBtn.addEventListener("click", () => {
        showGroupScreen("people");
    });
}

const groupEditNameInput =
    document.getElementById("groupEditNameInput");
if (groupEditNameInput) {
    groupEditNameInput.addEventListener("input", updateGroupNameCounter);
}

const groupEditDoneBtn =
    document.getElementById("groupEditDoneBtn");
if (groupEditDoneBtn) {
    groupEditDoneBtn.addEventListener("click", () => {
        if (!selectedGroup || !currentUser ||
            selectedGroup.created_by !== currentUser.id) {
            return;
        }
        pendingGroupName = groupEditNameInput.value;
        groupEditDoneBtn.disabled = true;
        editGroupBtn.click();
        groupEditDoneBtn.disabled = false;
    });
}

const groupInfoAddBtn =
    document.getElementById("groupInfoAddBtn");
if (groupInfoAddBtn && addMemberBtn) {
    groupInfoAddBtn.addEventListener("click", () => addMemberBtn.click());
}

const groupInfoLeaveBtn =
    document.getElementById("groupInfoLeaveBtn");
if (groupInfoLeaveBtn && leaveGroupBtn) {
    groupInfoLeaveBtn.addEventListener("click", () => leaveGroupBtn.click());
}

const settingsInviteBtn =
    document.getElementById("settingsInviteBtn");
if (settingsInviteBtn && inviteGroupBtn) {
    settingsInviteBtn.addEventListener("click", () => inviteGroupBtn.click());
}

const groupInfoOptionsBtn =
    document.getElementById("groupInfoOptionsBtn");
const groupOptionsMenu =
    document.getElementById("groupOptionsMenu");
if (groupInfoOptionsBtn && groupOptionsMenu) {
    groupInfoOptionsBtn.addEventListener("click", () => {
        groupOptionsMenu.hidden = !groupOptionsMenu.hidden;
    });
}

const optionsInviteBtn =
    document.getElementById("optionsInviteBtn");
if (optionsInviteBtn && inviteGroupBtn) {
    optionsInviteBtn.addEventListener("click", () => inviteGroupBtn.click());
}

const optionsLeaveBtn =
    document.getElementById("optionsLeaveBtn");
if (optionsLeaveBtn && leaveGroupBtn) {
    optionsLeaveBtn.addEventListener("click", () => leaveGroupBtn.click());
}

const groupCustomizeBtn =
    document.getElementById("groupCustomizeBtn");
if (groupCustomizeBtn) {
    groupCustomizeBtn.addEventListener("click", () => showGroupScreen("customize"));
}

const groupPrivacyBtn =
    document.getElementById("groupPrivacyBtn");
if (groupPrivacyBtn) {
    groupPrivacyBtn.addEventListener("click", () => showGroupScreen("privacy"));
}

const groupNicknamesBtn =
    document.getElementById("groupNicknamesBtn");
if (groupNicknamesBtn) {
    groupNicknamesBtn.addEventListener("click", () => showGroupScreen("nicknames"));
}

const groupCreateAnotherBtn =
    document.getElementById("groupCreateAnotherBtn");
if (groupCreateAnotherBtn && createGroupBtn) {
    groupCreateAnotherBtn.addEventListener("click", () => createGroupBtn.click());
}

document.querySelectorAll("[data-group-font]").forEach(option => {
    option.addEventListener("click", () => {
        document.querySelectorAll("[data-group-font]").forEach(item => {
            item.classList.toggle("is-selected", item === option);
        });
        const preview =
            document.querySelector(".group-customize-preview");
        if (preview) {
            preview.dataset.font = option.dataset.groupFont;
        }
    });
});

const groupCustomizeApplyBtn =
    document.getElementById("groupCustomizeApplyBtn");
if (groupCustomizeApplyBtn) {
    groupCustomizeApplyBtn.addEventListener("click", () => showGroupScreen("info"));
}

/* =========================================
NOTES / THOUGHTS
========================================= */

const createThoughtBtn =
document.getElementById("createThoughtBtn");

const noteComposerModal =
document.getElementById("noteComposerModal");

const closeNoteComposerBtn =
document.getElementById("closeNoteComposerBtn");

const noteComposerBackdrop =
document.getElementById("noteComposerBackdrop");

const noteTextInput =
document.getElementById("noteTextInput");

const thoughtEditorUsername =
document.getElementById("thoughtEditorUsername");

const openThoughtMusicPickerBtn =
document.getElementById("openThoughtMusicPickerBtn");

const thoughtMusicPicker =
document.getElementById("thoughtMusicPicker");

const thoughtMusicPickerBackdrop =
document.getElementById("thoughtMusicPickerBackdrop");

const closeThoughtMusicPickerBtn =
document.getElementById("closeThoughtMusicPickerBtn");

const cancelThoughtMusicPickerBtn =
document.getElementById("cancelThoughtMusicPickerBtn");

const thoughtMusicSearchInput =
document.getElementById("thoughtMusicSearchInput");

const thoughtMusicPickerMessage =
document.getElementById("thoughtMusicPickerMessage");

const thoughtMusicResults =
document.getElementById("thoughtMusicResults");

const thoughtMusicProviders =
document.getElementById("thoughtMusicProviders");

const thoughtMusicLoadMoreBtn =
document.getElementById("thoughtMusicLoadMoreBtn");

const addThoughtMusicBtn =
document.getElementById("addThoughtMusicBtn");

const selectedThoughtMusicElement =
document.getElementById("selectedThoughtMusic");

const noteCharCount =
document.getElementById("noteCharCount");

const noteMoodOptions =
document.getElementById("noteMoodOptions");

const noteAudienceSelect =
document.getElementById("noteAudienceSelect");

const saveNoteBtn =
document.getElementById("saveNoteBtn");

const noteComposerMessage =
document.getElementById("noteComposerMessage");

const thoughtMusicSheet =
document.getElementById("thoughtMusicSheet");

const thoughtSheetMetadata =
document.getElementById("thoughtSheetMetadata");

const thoughtSheetAddSong =
document.getElementById("thoughtSheetAddSong");

const thoughtSheetAvatar =
document.getElementById("thoughtSheetAvatar");

const thoughtSheetArtistTrack =
document.getElementById("thoughtSheetArtistTrack");

const thoughtSheetTrackTitle =
document.getElementById("thoughtSheetTrackTitle");

const thoughtSheetPlayButton =
document.getElementById("thoughtSheetPlayButton");

const thoughtSheetMood =
document.getElementById("thoughtSheetMood");

const thoughtSheetKaraoke =
document.getElementById("thoughtSheetKaraoke");

const thoughtSheetToast =
document.getElementById("thoughtSheetToast");

const thoughtSheetReplyForm =
document.getElementById("thoughtSheetReplyForm");

const thoughtSheetReplyInput =
document.getElementById("thoughtSheetReplyInput");

const thoughtSheetHeart =
document.getElementById("thoughtSheetHeart");

let selectedNoteMood = "";
let activeThoughtAudio = null;
let activeThoughtAudioButton = null;
let selectedThoughtMusic = null;
let pendingThoughtMusic = null;
let thoughtMusicSearchController = null;
let thoughtMusicSearchTimer = null;
let thoughtMusicProvider = "apple";
let thoughtMusicOffset = 0;
let thoughtMusicHasMore = false;
let thoughtMusicLoading = false;
let activeThoughtEditorNote = null;
let openThoughtSheetNote = null;
let currentThoughtUsername = "Your Note";
let currentThoughtAvatarUrl = "";
let thoughtSheetAnimationTimer = null;
let thoughtSheetToastTimer = null;
let thoughtSheetCloseTimer = null;
let thoughtSheetKaraokeTimer = null;
let thoughtSheetAudioState = { audio: null };

const THOUGHT_MUSIC_PAGE_SIZE = 25;
const THOUGHT_MUSIC_MAX_RESULTS = 200;

function getThoughtMusicDetails(music) {

    if (typeof music === "string") {
        try {
            const parsedMusic = JSON.parse(music);

            if (parsedMusic && typeof parsedMusic === "object") {
                music = parsedMusic;
            } else {
                return {
                    id: "",
                    title: music.trim(),
                    artist: "",
                    artwork: "",
                    previewUrl: ""
                };
            }
        } catch {
            return {
                id: "",
                title: music.trim(),
                artist: "",
                artwork: "",
                previewUrl: ""
            };
        }
    }

    if (!music || typeof music !== "object" || Array.isArray(music)) {
        return {
            id: "",
            title: "",
            artist: "",
            artwork: "",
            previewUrl: ""
        };
    }

    return {
        id: music.trackId === undefined || music.trackId === null
            ? music.id === undefined || music.id === null
                ? ""
                : String(music.id)
            : String(music.trackId),
        title: typeof music.trackName === "string"
            ? music.trackName.trim()
            : typeof music.title === "string"
                ? music.title.trim()
                : "",
        artist: typeof music.artistName === "string"
            ? music.artistName.trim()
            : typeof music.artist === "string"
                ? music.artist.trim()
                : "",
        artwork: typeof music.artworkUrl100 === "string"
            ? music.artworkUrl100.trim()
            : typeof music.artwork === "string"
                ? music.artwork.trim()
                : "",
        previewUrl: typeof music.previewUrl === "string"
            ? music.previewUrl.trim()
            : typeof music.preview_url === "string"
                ? music.preview_url.trim()
                : typeof music.url === "string"
                    ? music.url.trim()
                    : "",
        provider: typeof music.provider === "string"
            ? music.provider.trim().toLowerCase()
            : music.trackId !== undefined || music.trackViewUrl
                ? "apple"
                : ""
    };
}

function getThoughtMusicExtras(music) {
    if (typeof music === "string") {
        try {
            music = JSON.parse(music);
        } catch {
            return { artists: [], lyricLines: [] };
        }
    }

    if (!music || typeof music !== "object" || Array.isArray(music)) {
        return { artists: [], lyricLines: [] };
    }

    const rawArtists = Array.isArray(music.artists)
        ? music.artists
        : typeof music.artists === "string"
            ? music.artists.split(",")
            : [];
    const artists = rawArtists
        .filter(function (artist) {
            return typeof artist === "string";
        })
        .map(function (artist) {
            return artist.trim();
        })
        .filter(Boolean);

    if (!artists.length) {
        const fallbackArtist =
            typeof music.artistName === "string"
                ? music.artistName
                : typeof music.artist === "string"
                    ? music.artist
                    : "";
        if (fallbackArtist.trim()) artists.push(fallbackArtist.trim());
    }

    const rawLyrics = Array.isArray(music.lyricLines)
        ? music.lyricLines
        : typeof music.lyricLines === "string"
            ? music.lyricLines.split("|")
            : [];

    return {
        artists: artists,
        lyricLines: rawLyrics
            .filter(function (line) {
                return typeof line === "string";
            })
            .map(function (line) {
                return line.trim();
            })
            .filter(Boolean)
            .slice(0, 8)
    };
}

function formatThoughtAge(createdAt) {
    const createdTime = Date.parse(createdAt || "");
    if (!Number.isFinite(createdTime)) return "";

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));
    if (elapsedMinutes < 60) return `${Math.max(1, elapsedMinutes)}m`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h`;

    return `${Math.floor(elapsedHours / 24)}d`;
}

function stopThoughtSheetKaraoke() {
    if (thoughtSheetKaraokeTimer) {
        clearTimeout(thoughtSheetKaraokeTimer);
        thoughtSheetKaraokeTimer = null;
    }
}

function startThoughtSheetKaraoke(lines) {
    if (!thoughtSheetKaraoke) return;

    stopThoughtSheetKaraoke();
    const lyricLines = lines.length
        ? lines
        : [
            "raat ki hawa, dil ko kuch keh rahi",
            "chhoti si vibe, par yaadein reh gayi",
            "kal ka kya, aaj ko jee le"
        ];
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
        thoughtSheetKaraoke.textContent = lyricLines[0];
        thoughtSheetKaraoke.classList.add("is-static");
        return;
    }

    thoughtSheetKaraoke.classList.remove("is-static", "is-fading");
    let lineIndex = 0;
    let wordIndex = 0;
    let wordNodes = [];

    function showLine() {
        thoughtSheetKaraoke.replaceChildren();
        thoughtSheetKaraoke.classList.remove("is-fading");
        const words = lyricLines[lineIndex].split(/\s+/).filter(Boolean);
        wordNodes = words.map(function (word, index) {
            const node = document.createElement("span");
            node.className = "thought-karaoke-word";
            node.textContent = word + (index < words.length - 1 ? " " : "");
            thoughtSheetKaraoke.appendChild(node);
            return node;
        });
        wordIndex = 0;
        illuminateNextWord();
    }

    function illuminateNextWord() {
        if (wordIndex < wordNodes.length) {
            wordNodes[wordIndex].classList.add("is-lit");
            wordIndex += 1;
            thoughtSheetKaraokeTimer =
                setTimeout(illuminateNextWord, 430);
            return;
        }

        thoughtSheetKaraokeTimer = setTimeout(function () {
            thoughtSheetKaraoke.classList.add("is-fading");
            thoughtSheetKaraokeTimer = setTimeout(function () {
                lineIndex = (lineIndex + 1) % lyricLines.length;
                showLine();
            }, 500);
        }, 700);
    }

    showLine();
}

function closeThoughtMusicSheet() {
    if (!thoughtMusicSheet || thoughtMusicSheet.hidden) return;

    if (activeThoughtAudioButton === thoughtSheetPlayButton) {
        activeThoughtAudio.pause();
        activeThoughtAudio = null;
        activeThoughtAudioButton = null;
        thoughtSheetAudioState.audio = null;
        setThoughtAudioButton(thoughtSheetPlayButton, false);
    }

    stopThoughtSheetKaraoke();
    thoughtMusicSheet.classList.remove("is-open");
    clearTimeout(thoughtSheetCloseTimer);
    thoughtSheetCloseTimer = setTimeout(function () {
        thoughtMusicSheet.hidden = true;
        thoughtSheetCloseTimer = null;
    }, 350);
}

function openThoughtMusicSheet(note, username, avatarUrl) {
    if (!thoughtMusicSheet || !note || !note.music) return;

    if (activeThoughtAudioButton === thoughtSheetPlayButton) {
        activeThoughtAudio.pause();
        activeThoughtAudio = null;
        activeThoughtAudioButton = null;
        setThoughtAudioButton(thoughtSheetPlayButton, false);
    }

    clearTimeout(thoughtSheetCloseTimer);
    thoughtSheetCloseTimer = null;
    openThoughtSheetNote = note;
    thoughtSheetAudioState = { audio: null };

    const details = getThoughtMusicDetails(note.music);
    const extras = getThoughtMusicExtras(note.music);
    const artistText = extras.artists.join(", ") || details.artist;
    const age = formatThoughtAge(note.created_at);

    if (thoughtSheetMetadata) {
        thoughtSheetMetadata.textContent =
            `${username || "User"}${age ? ` · ${age}` : ""}`;
    }

    if (thoughtSheetAvatar) {
        thoughtSheetAvatar.replaceChildren();
        if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) {
            const image = document.createElement("img");
            image.src = avatarUrl;
            image.alt = `${username || "User"} avatar`;
            thoughtSheetAvatar.appendChild(image);
        } else {
            thoughtSheetAvatar.textContent =
                (username || "U").charAt(0).toUpperCase();
        }
    }

    if (thoughtSheetArtistTrack) {
        thoughtSheetArtistTrack.replaceChildren();
        [artistText || details.title || "Selected song", artistText || details.title || "Selected song"]
            .forEach(function (text) {
                const span = document.createElement("span");
                span.textContent = text;
                thoughtSheetArtistTrack.appendChild(span);
            });
        thoughtSheetArtistTrack.classList.toggle(
            "is-marquee",
            (artistText || details.title || "").length > 24
        );
    }

    if (thoughtSheetTrackTitle) {
        thoughtSheetTrackTitle.textContent = details.title;
    }

    const savedPreviewUrl =
        getPlayableThoughtPreviewUrl(note.music);
    if (thoughtSheetPlayButton) {
        thoughtSheetPlayButton.hidden = !savedPreviewUrl;
        setThoughtAudioButton(thoughtSheetPlayButton, false);
        thoughtSheetPlayButton.textContent = "▶ Preview";
    }

    if (thoughtSheetMood) {
        thoughtSheetMood.textContent = note.mood || "";
    }

    thoughtMusicSheet.hidden = false;
    requestAnimationFrame(function () {
        thoughtMusicSheet.classList.add("is-open");
    });
    startThoughtSheetKaraoke(extras.lyricLines);

    if (thoughtSheetReplyInput) {
        thoughtSheetReplyInput.placeholder =
            `Message ${username || "User"}`;
        thoughtSheetReplyInput.setAttribute(
            "aria-label",
            `Message ${username || "User"}`
        );
    }

    if (thoughtSheetHeart) {
        thoughtSheetHeart.textContent = "♡";
        thoughtSheetHeart.setAttribute("aria-pressed", "false");
    }
}

function openThoughtMusicFromUserGesture(note, username, avatarUrl, event) {
    if (!event || !event.isTrusted || !note || !note.music) {
        return;
    }

    const previewUrl = getPlayableThoughtPreviewUrl(note.music);
    openThoughtMusicSheet(note, username, avatarUrl);

    if (previewUrl && thoughtSheetPlayButton) {
        toggleThoughtAudio(
            previewUrl,
            thoughtSheetPlayButton,
            thoughtSheetAudioState,
            event
        );
    }
}

function showThoughtSheetToast(message) {
    if (!thoughtSheetToast) return;

    thoughtSheetToast.textContent = message;
    thoughtSheetToast.classList.add("is-visible");
    clearTimeout(thoughtSheetToastTimer);
    thoughtSheetToastTimer = setTimeout(function () {
        thoughtSheetToast.classList.remove("is-visible");
    }, 1600);
}

function setThoughtAudioButton(button, playing) {
    button.textContent = playing ? "❚❚" : "▶";
    button.title = playing ? "Pause song preview" : "Play song preview";
    button.setAttribute(
        "aria-label",
        playing ? "Pause song preview" : "Play song preview"
    );
}

function getPlayableThoughtPreviewUrl(music) {
    const details = getThoughtMusicDetails(music);

    if (!details.previewUrl) {
        return "";
    }

    try {
        const url = new URL(details.previewUrl);
        return url.protocol === "https:" &&
            !url.username &&
            !url.password
                ? details.previewUrl
                : "";
    } catch {
        return "";
    }
}

function reportThoughtAudioFailure(audio, button, error) {
    setThoughtAudioButton(button, false);
    button.title = "This preview is unavailable. Try another track.";
    button.setAttribute(
        "aria-label",
        "This preview is unavailable. Try another track."
    );

    if (
        thoughtMusicPickerMessage &&
        thoughtMusicPicker &&
        !thoughtMusicPicker.hidden
    ) {
        const mediaError = audio && audio.error;
        const mediaErrorMessage = mediaError
            ? [
                "Media error",
                mediaError.code,
                mediaError.message
            ].filter(Boolean).join(": ")
            : error && error.message
                ? error.message
                : "The browser could not load this preview.";

        thoughtMusicPickerMessage.textContent =
            `Preview unavailable: ${mediaErrorMessage}. Try another track.`;
    }

    console.error("THOUGHT MUSIC PLAYBACK ERROR:", {
        error: error || null,
        mediaError: audio && audio.error
            ? {
                code: audio.error.code,
                message: audio.error.message
            }
            : null,
        currentSrc: audio ? audio.currentSrc : "",
        networkState: audio ? audio.networkState : null,
        readyState: audio ? audio.readyState : null
    });
}

function toggleThoughtAudio(audioUrl, button, audioState, event) {
    if (!event || !event.isTrusted) {
        return;
    }

    if (
        activeThoughtAudioButton === button &&
        activeThoughtAudio
    ) {
        if (activeThoughtAudio.paused) {
            activeThoughtAudio.play()
                .then(function () {
                    if (
                        activeThoughtAudio === audioState.audio &&
                        !audioState.audio.paused
                    ) {
                        setThoughtAudioButton(button, true);
                    }
                })
                .catch(function (error) {
                    reportThoughtAudioFailure(audioState.audio, button, error);
                });
        } else {
            activeThoughtAudio.pause();
            setThoughtAudioButton(button, false);
        }

        return;
    }

    if (activeThoughtAudio) {
        activeThoughtAudio.pause();
    }

    if (activeThoughtAudioButton) {
        setThoughtAudioButton(activeThoughtAudioButton, false);
    }

    if (!audioState.audio) {
        audioState.audio = new Audio();
        audioState.audio.preload = "none";
        audioState.audio.src = audioUrl;
        audioState.audio.addEventListener(
            "canplay",
            function () {
                button.title = "Play song preview";
                button.setAttribute("aria-label", "Play song preview");
            }
        );
        audioState.audio.addEventListener(
            "error",
            function () {
                reportThoughtAudioFailure(
                    audioState.audio,
                    button,
                    null
                );
            }
        );
        audioState.audio.addEventListener(
            "ended",
            function () {
                setThoughtAudioButton(button, false);

                if (activeThoughtAudio === audioState.audio) {
                    activeThoughtAudio = null;
                    activeThoughtAudioButton = null;
                }
            }
        );
    }

    activeThoughtAudio = audioState.audio;
    activeThoughtAudioButton = button;

    activeThoughtAudio.play()
        .then(function () {
            if (
                activeThoughtAudio === audioState.audio &&
                !audioState.audio.paused
            ) {
                setThoughtAudioButton(button, true);
            }
        })
        .catch(function (error) {
            reportThoughtAudioFailure(audioState.audio, button, error);
        });
}

async function searchThoughtSongs(query, signal, offset = 0) {
    const endpoint =
        "https://itunes.apple.com/search";

    // iTunes Search currently ignores `offset`; expand its limit and slice
    // client-side to provide stable 25-result pages without repeating tracks.
    const requestLimit =
        Math.min(offset + THOUGHT_MUSIC_PAGE_SIZE, THOUGHT_MUSIC_MAX_RESULTS);

    const params =
        new URLSearchParams({
            term: query,
            entity: "song",
            limit: String(requestLimit)
        });

    const response =
        await fetch(`${endpoint}?${params.toString()}`, { signal });

    if (!response.ok) {
        throw new Error("Song search is unavailable right now.");
    }

    const payload =
        await response.json();

    const rawResults =
        Array.isArray(payload.results) ? payload.results : [];

    const tracks =
        rawResults
        .slice(offset, offset + THOUGHT_MUSIC_PAGE_SIZE)
        .filter(function (track) {
            let isApplePreview = false;

            if (typeof track.previewUrl === "string") {
                try {
                    const previewUrl = new URL(track.previewUrl);
                    isApplePreview =
                        previewUrl.protocol === "https:" &&
                        !previewUrl.username &&
                        !previewUrl.password;
                } catch {
                    isApplePreview = false;
                }
            }

            return (
                track.trackId !== undefined &&
                typeof track.trackName === "string" &&
                typeof track.artistName === "string" &&
                isApplePreview
            );
        })
        .map(function (track) {
            return {
                provider: "apple",
                trackId: track.trackId,
                id: String(track.trackId),
                trackName: track.trackName,
                title: track.trackName,
                artistName: track.artistName,
                artist: track.artistName,
                artworkUrl100: typeof track.artworkUrl100 === "string"
                    ? track.artworkUrl100
                    : "",
                artwork: typeof track.artworkUrl100 === "string"
                    ? track.artworkUrl100
                    : "",
                previewUrl: track.previewUrl,
                externalUrl: typeof track.trackViewUrl === "string"
                    ? track.trackViewUrl
                    : "",
                trackViewUrl: typeof track.trackViewUrl === "string"
                    ? track.trackViewUrl
                    : ""
            };
        });

    return {
        tracks: tracks,
        nextOffset: offset + THOUGHT_MUSIC_PAGE_SIZE,
        hasMore:
            requestLimit < THOUGHT_MUSIC_MAX_RESULTS &&
            rawResults.length >= requestLimit,
        limitReached:
            requestLimit === THOUGHT_MUSIC_MAX_RESULTS &&
            rawResults.length >= THOUGHT_MUSIC_MAX_RESULTS
    };
}

function renderThoughtMusicSelection() {

    if (!selectedThoughtMusicElement || !openThoughtMusicPickerBtn) {
        return;
    }

    selectedThoughtMusicElement.replaceChildren();
    selectedThoughtMusicElement.hidden = !selectedThoughtMusic;

    openThoughtMusicPickerBtn.textContent =
        selectedThoughtMusic
            ? "♪ Change song"
            : "♪ Choose a song";

    if (!selectedThoughtMusic) {
        return;
    }

    const details =
        getThoughtMusicDetails(selectedThoughtMusic);

    const label =
        document.createElement("span");

    label.textContent =
        [details.title, details.artist].filter(Boolean).join(" - ");

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove selected song");
    removeButton.addEventListener(
        "click",
        function () {
            selectedThoughtMusic = null;
            renderThoughtMusicSelection();
        }
    );

    selectedThoughtMusicElement.append(label, removeButton);
}

function renderThoughtMusicResults(tracks, append = false) {

    if (!thoughtMusicResults) {
        return;
    }

    if (!append) {
        thoughtMusicResults.replaceChildren();
    }

    tracks.forEach(function (track) {
        const songKey =
            `${track.provider || "apple"}:${track.trackId}`;

        if (
            thoughtMusicResults.querySelector(
                `[data-song-id="${songKey}"]`
            )
        ) {
            return;
        }

        const result =
            document.createElement("article");

        result.className =
            "thought-music-result";

        result.setAttribute("role", "button");
        result.tabIndex = 0;

        result.dataset.songId =
            songKey;

        if (
            pendingThoughtMusic &&
            `${pendingThoughtMusic.provider || "apple"}:${pendingThoughtMusic.trackId}` === songKey
        ) {
            result.classList.add("selected");
        }

        if (track.artworkUrl100 || track.artwork) {
            const artwork =
                document.createElement("img");

            artwork.className =
                "thought-music-artwork";

            artwork.src =
                track.artworkUrl100 || track.artwork;

            artwork.alt =
                "";

            artwork.loading =
                "lazy";

            result.appendChild(artwork);
        }

        const details =
            document.createElement("div");

        details.className =
            "thought-music-result-details";

        const title =
            document.createElement("strong");

        title.textContent =
            track.trackName || track.title;

        const artist =
            document.createElement("span");

        artist.textContent =
            track.artistName || track.artist;

        const provider =
            document.createElement("small");

        provider.className =
            "thought-music-provider-label";

        provider.textContent =
            "Apple Music";

        details.append(title, artist, provider);
        result.appendChild(details);

        const playablePreviewUrl =
            getPlayableThoughtPreviewUrl(track);

        const hasPreview =
            Boolean(playablePreviewUrl);

        if (hasPreview) {
            const previewButton =
                document.createElement("button");

            previewButton.type = "button";
            previewButton.className = "thought-music-preview-btn";
            previewButton.textContent = "▶";
            previewButton.setAttribute(
                "aria-label",
                `Preview ${track.trackName || track.title}`
            );

            const audioState = { audio: null };

            previewButton.addEventListener(
                "click",
                function (event) {
                    event.stopPropagation();
                    toggleThoughtAudio(
                        playablePreviewUrl,
                        previewButton,
                        audioState,
                        event
                    );
                }
            );

            result.appendChild(previewButton);
        }

        function selectTrack(event) {
            if (event.target.closest("button, a")) {
                return;
            }

            if (
                event.type === "keydown" &&
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            if (event.type === "keydown") {
                event.preventDefault();
            }

            pendingThoughtMusic = track;

            thoughtMusicResults
                .querySelectorAll(".thought-music-result")
                .forEach(function (item) {
                    item.classList.toggle(
                        "selected",
                        item.dataset.songId === songKey
                    );
                });

            if (addThoughtMusicBtn) {
                addThoughtMusicBtn.disabled = false;
            }

            if (thoughtMusicPickerMessage) {
                thoughtMusicPickerMessage.textContent =
                    hasPreview
                        ? `Selected ${track.trackName || track.title} — ${track.artistName || track.artist}. Preview it before adding.`
                        : `Selected ${track.trackName || track.title} — ${track.artistName || track.artist}.`;
            }
        }

        result.addEventListener("click", selectTrack);
        result.addEventListener("keydown", selectTrack);

        thoughtMusicResults.appendChild(result);
    });
}

async function searchThoughtMusicProvider(provider, query, signal, offset) {
    if (provider !== "apple") {
        throw new Error("Apple Music is the only available music provider.");
    }

    return searchThoughtSongs(query, signal, offset);
}

async function loadThoughtMusicResults(query, offset = 0) {

    if (!thoughtMusicPickerMessage || !thoughtMusicResults) {
        return;
    }

    const append =
        offset > 0;

    if (thoughtMusicSearchController) {
        thoughtMusicSearchController.abort();
    }

    const controller =
        new AbortController();

    thoughtMusicSearchController =
        controller;

    thoughtMusicLoading = true;
    if (thoughtMusicLoadMoreBtn) {
        thoughtMusicLoadMoreBtn.disabled = true;
        thoughtMusicLoadMoreBtn.hidden = true;
    }

    thoughtMusicPickerMessage.textContent =
        append
            ? "Loading more Apple Music results..."
            : "Searching Apple Music...";

    if (!append) {
        thoughtMusicResults.replaceChildren();
    }

    try {
        const page =
            await searchThoughtMusicProvider(
                thoughtMusicProvider,
                query,
                controller.signal,
                offset
            );

        if (controller.signal.aborted) {
            return;
        }

        renderThoughtMusicResults(page.tracks, append);
        thoughtMusicOffset = page.nextOffset;
        thoughtMusicHasMore = page.hasMore;

        if (!thoughtMusicResults.childElementCount) {
            thoughtMusicPickerMessage.textContent =
                page.hasMore
                    ? "No playable previews in this batch."
                    : "No playable Apple Music previews found. Try another search.";
        } else if (page.hasMore) {
            thoughtMusicPickerMessage.textContent =
                "Tap a song to select it; use ▶ to preview. More results are available.";
        } else if (page.limitReached) {
            thoughtMusicPickerMessage.textContent =
                "Tap a song to select it; use ▶ to preview.";
        } else {
            thoughtMusicPickerMessage.textContent =
                "Tap a song to select it; use ▶ to preview. No more playable previews.";
        }

        if (thoughtMusicLoadMoreBtn) {
            thoughtMusicLoadMoreBtn.hidden = !page.hasMore;
            thoughtMusicLoadMoreBtn.disabled = false;
        }

        if (
            page.limitReached &&
            thoughtMusicPickerMessage
        ) {
            thoughtMusicPickerMessage.textContent +=
                " Apple Music's 200-result search limit was reached.";
        }
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        thoughtMusicPickerMessage.textContent =
            `Apple Music search error: ${error.message || "Could not search songs."}`;

        if (append && thoughtMusicHasMore && thoughtMusicLoadMoreBtn) {
            thoughtMusicLoadMoreBtn.hidden = false;
        }

        console.error("THOUGHT MUSIC SEARCH ERROR:", error);
    } finally {
        if (thoughtMusicSearchController === controller) {
            thoughtMusicLoading = false;
            if (thoughtMusicLoadMoreBtn) {
                thoughtMusicLoadMoreBtn.disabled = false;
            }
        }
    }
}

function openThoughtMusicPicker() {

    if (!thoughtMusicPicker) {
        return;
    }

    pendingThoughtMusic = null;

    if (addThoughtMusicBtn) {
        addThoughtMusicBtn.disabled = true;
    }

    thoughtMusicPicker.hidden = false;

    if (thoughtMusicSearchInput) {
        thoughtMusicSearchInput.focus();
    }
}

function closeThoughtMusicPicker() {

    if (thoughtMusicSearchTimer) {
        clearTimeout(thoughtMusicSearchTimer);
        thoughtMusicSearchTimer = null;
    }

    if (thoughtMusicSearchController) {
        thoughtMusicSearchController.abort();
        thoughtMusicSearchController = null;
    }

    if (activeThoughtAudio) {
        activeThoughtAudio.pause();
        activeThoughtAudio = null;

        if (activeThoughtAudioButton) {
            setThoughtAudioButton(activeThoughtAudioButton, false);
        }

        activeThoughtAudioButton = null;
    }

    if (thoughtMusicPicker) {
        thoughtMusicPicker.hidden = true;
    }

    pendingThoughtMusic = null;
}

function createThoughtMusicElement(music) {

    const details = getThoughtMusicDetails(music);

    if (
        !details.title &&
        !details.artist &&
        !details.previewUrl &&
        !details.artwork
    ) {
        return null;
    }

    const musicLine =
        document.createElement("div");

    musicLine.className =
        "thought-music";

    const playableUrl =
        getPlayableThoughtPreviewUrl(music);

    if (playableUrl) {
        const playButton =
            document.createElement("button");

        playButton.type =
            "button";

        playButton.className =
            "thought-music-play";

        playButton.textContent =
            "▶";

        playButton.setAttribute(
            "aria-label",
            "Play attached song"
        );

        const audioState = { audio: null };

        playButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();
                toggleThoughtAudio(
                    playableUrl,
                    playButton,
                    audioState,
                    event
                );
            }
        );

        musicLine.appendChild(playButton);
    } else {
        const musicIcon =
            document.createElement("span");

        musicIcon.className =
            "thought-music-icon";

        musicIcon.setAttribute("aria-hidden", "true");
        musicIcon.textContent = "♪";
        musicLine.appendChild(musicIcon);
    }

    const musicText =
        document.createElement("span");

    musicText.className =
        "thought-music-text";

    musicText.textContent =
        [details.title, details.artist].filter(Boolean).join(" - ") ||
        details.previewUrl;

    musicLine.appendChild(musicText);

    const providerName =
        details.provider === "apple"
            ? "Apple Music"
            : "";

    if (providerName) {
        const providerLabel =
            document.createElement("small");

        providerLabel.className =
            "thought-music-provider-label";

        providerLabel.textContent =
            providerName;

        musicLine.appendChild(providerLabel);
    }

    if (details.artwork && /^https:\/\//i.test(details.artwork)) {
        const artwork =
            document.createElement("img");

        artwork.className =
            "thought-music-artwork";

        artwork.src =
            details.artwork;

        artwork.alt =
            "";

        artwork.loading =
            "lazy";

        musicLine.appendChild(artwork);
    }

    return musicLine;
}

/* OPEN COMPOSER */

function openNoteComposer(note = activeThoughtEditorNote) {

if (!noteComposerModal) return;

if (!note || !note.id || !note.user_id) {
    note = activeThoughtEditorNote;
}

noteComposerModal.hidden = false;

activeThoughtEditorNote = note || null;
selectedNoteMood = note && note.mood ? note.mood : "";
selectedThoughtMusic = null;
if (note && note.music) {
    if (typeof note.music === "string") {
        try {
            const parsedMusic = JSON.parse(note.music);
            selectedThoughtMusic =
                parsedMusic &&
                typeof parsedMusic === "object" &&
                !Array.isArray(parsedMusic)
                    ? parsedMusic
                    : { provider: "apple", title: note.music };
        } catch {
            selectedThoughtMusic = {
                provider: "apple",
                title: note.music
            };
        }
    } else if (typeof note.music === "object" && !Array.isArray(note.music)) {
        selectedThoughtMusic = note.music;
    }
}
renderThoughtMusicSelection();

if (thoughtEditorUsername) {
    thoughtEditorUsername.value = currentThoughtUsername;
}

if (noteTextInput) {
    noteTextInput.value = note && typeof note.text === "string"
        ? note.text
        : "";
    noteTextInput.focus();
}

if (noteCharCount) {
    noteCharCount.textContent = String(noteTextInput ? noteTextInput.value.length : 0);
}

if (noteAudienceSelect) {
    noteAudienceSelect.value = note && note.audience
        ? note.audience
        : "public";
}

if (noteComposerMessage) {
    noteComposerMessage.textContent = "";
}

document
    .querySelectorAll("#noteMoodOptions button")
    .forEach(button => {
        button.classList.toggle(
            "selected",
            (button.dataset.mood || "") === selectedNoteMood
        );
    });

if (thoughtMusicPicker) {
    thoughtMusicPicker.hidden = true;
}

}

/* CLOSE COMPOSER */

function closeNoteComposer() {

if (!noteComposerModal) return;

closeThoughtMusicPicker();
noteComposerModal.hidden = true;


}

/* OPEN BUTTON */

if (createThoughtBtn) {


createThoughtBtn.addEventListener(
    "click",
    openNoteComposer
);


}

/* CLOSE BUTTON */

if (closeNoteComposerBtn) {


closeNoteComposerBtn.addEventListener(
    "click",
    closeNoteComposer
);

}

/* BACKDROP CLOSE */

if (noteComposerBackdrop) {


noteComposerBackdrop.addEventListener(
    "click",
    closeNoteComposer
);

}

/* ESC KEY */

document.addEventListener(
"keydown",
event => {
    if (
        event.key === "Escape" &&
        thoughtMusicSheet &&
        !thoughtMusicSheet.hidden
    ) {
        closeThoughtMusicSheet();
        return;
    }

    if (
        event.key === "Escape" &&
        noteComposerModal &&
        !noteComposerModal.hidden
    ) {
        if (thoughtMusicPicker && !thoughtMusicPicker.hidden) {
            closeThoughtMusicPicker();
        } else {
            closeNoteComposer();
        }
    }

}

);

if (openThoughtMusicPickerBtn) {
    openThoughtMusicPickerBtn.addEventListener(
        "click",
        openThoughtMusicPicker
    );
}

if (thoughtMusicSheet) {
    thoughtMusicSheet.addEventListener("click", function (event) {
        if (event.target.closest("[data-thought-sheet-close]")) {
            closeThoughtMusicSheet();
        }
    });
}

if (thoughtSheetPlayButton) {
    thoughtSheetPlayButton.addEventListener("click", function (event) {
        if (!openThoughtSheetNote || !openThoughtSheetNote.music) {
            return;
        }

        const savedPreviewUrl =
            getPlayableThoughtPreviewUrl(openThoughtSheetNote.music);

        if (savedPreviewUrl) {
            toggleThoughtAudio(
                savedPreviewUrl,
                thoughtSheetPlayButton,
                thoughtSheetAudioState,
                event
            );
        }
    });
}

if (thoughtSheetAddSong) {
    thoughtSheetAddSong.addEventListener("click", function () {
        closeThoughtMusicSheet();
        openNoteComposer(activeThoughtEditorNote);
        openThoughtMusicPicker();
    });
}

if (thoughtSheetReplyForm) {
    thoughtSheetReplyForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (thoughtSheetReplyInput) {
            thoughtSheetReplyInput.value = "";
        }
        showThoughtSheetToast("Sent ✓");
    });

    thoughtSheetReplyForm
        .querySelectorAll("[data-reply-emoji]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                if (!thoughtSheetReplyInput) return;
                const start = thoughtSheetReplyInput.selectionStart;
                const end = thoughtSheetReplyInput.selectionEnd;
                const value = thoughtSheetReplyInput.value;
                const emoji = button.dataset.replyEmoji || "";
                thoughtSheetReplyInput.value =
                    value.slice(0, start) + emoji + value.slice(end);
                const caret = start + emoji.length;
                thoughtSheetReplyInput.setSelectionRange(caret, caret);
                thoughtSheetReplyInput.focus();
            });
        });
}

if (thoughtSheetHeart) {
    thoughtSheetHeart.addEventListener("click", function () {
        const liked =
            thoughtSheetHeart.getAttribute("aria-pressed") === "true";
        thoughtSheetHeart.setAttribute("aria-pressed", String(!liked));
        thoughtSheetHeart.textContent = liked ? "♡" : "❤️";
    });
}

if (thoughtMusicPickerBackdrop) {
    thoughtMusicPickerBackdrop.addEventListener(
        "click",
        closeThoughtMusicPicker
    );
}

if (closeThoughtMusicPickerBtn) {
    closeThoughtMusicPickerBtn.addEventListener(
        "click",
        closeThoughtMusicPicker
    );
}

if (cancelThoughtMusicPickerBtn) {
    cancelThoughtMusicPickerBtn.addEventListener(
        "click",
        closeThoughtMusicPicker
    );
}

if (thoughtMusicProviders) {
    thoughtMusicProviders.addEventListener(
        "click",
        function (event) {
            const button =
                event.target.closest("[data-music-provider]");

            if (!button || button.disabled) {
                return;
            }

            thoughtMusicProvider =
                button.dataset.musicProvider || "apple";

            thoughtMusicProviders
                .querySelectorAll("[data-music-provider]")
                .forEach(function (providerButton) {
                    providerButton.setAttribute(
                        "aria-pressed",
                        String(providerButton === button)
                    );
                });

            thoughtMusicOffset = 0;
            thoughtMusicHasMore = false;
            thoughtMusicLoading = false;

            const query =
                thoughtMusicSearchInput
                    ? thoughtMusicSearchInput.value.trim()
                    : "";

            if (query.length >= 2) {
                loadThoughtMusicResults(query, 0);
            } else if (thoughtMusicPickerMessage) {
                thoughtMusicPickerMessage.textContent =
                    "Enter at least 2 characters to search.";
            }
        }
    );
}

if (thoughtMusicSearchInput) {
    thoughtMusicSearchInput.addEventListener(
        "input",
        function () {
            if (thoughtMusicSearchTimer) {
                clearTimeout(thoughtMusicSearchTimer);
            }

            if (thoughtMusicSearchController) {
                thoughtMusicSearchController.abort();
                thoughtMusicSearchController = null;
            }

            thoughtMusicOffset = 0;
            thoughtMusicHasMore = false;
            thoughtMusicLoading = false;

            if (thoughtMusicLoadMoreBtn) {
                thoughtMusicLoadMoreBtn.hidden = true;
                thoughtMusicLoadMoreBtn.disabled = false;
            }

            const query =
                thoughtMusicSearchInput.value.trim();

            pendingThoughtMusic = null;

            if (addThoughtMusicBtn) {
                addThoughtMusicBtn.disabled = true;
            }

            if (query.length < 2) {
                if (thoughtMusicSearchController) {
                    thoughtMusicSearchController.abort();
                    thoughtMusicSearchController = null;
                }

                if (thoughtMusicResults) {
                    thoughtMusicResults.replaceChildren();
                }

                if (thoughtMusicPickerMessage) {
                    thoughtMusicPickerMessage.textContent =
                        "Enter at least 2 characters to search.";
                }

                return;
            }

            if (thoughtMusicResults) {
                thoughtMusicResults.replaceChildren();
            }

            if (thoughtMusicPickerMessage) {
                thoughtMusicPickerMessage.textContent =
                    "Searching Apple Music...";
            }

            thoughtMusicSearchTimer =
                setTimeout(
                    function () {
                        loadThoughtMusicResults(query);
                    },
                    300
                );
        }
    );
}

if (thoughtMusicLoadMoreBtn) {
    thoughtMusicLoadMoreBtn.addEventListener(
        "click",
        function () {
            if (
                thoughtMusicLoading ||
                !thoughtMusicHasMore ||
                !thoughtMusicSearchInput
            ) {
                return;
            }

            loadThoughtMusicResults(
                thoughtMusicSearchInput.value.trim(),
                thoughtMusicOffset
            );
        }
    );
}

if (addThoughtMusicBtn) {
    addThoughtMusicBtn.addEventListener(
        "click",
        function () {
            if (!pendingThoughtMusic) {
                return;
            }

            selectedThoughtMusic = {
                provider: pendingThoughtMusic.provider || "apple",
                id: pendingThoughtMusic.id || pendingThoughtMusic.trackId,
                title: pendingThoughtMusic.title || pendingThoughtMusic.trackName,
                artist: pendingThoughtMusic.artist || pendingThoughtMusic.artistName,
                artwork: pendingThoughtMusic.artwork || pendingThoughtMusic.artworkUrl100,
                externalUrl: pendingThoughtMusic.externalUrl || pendingThoughtMusic.trackViewUrl,
                trackId: pendingThoughtMusic.trackId,
                trackName: pendingThoughtMusic.trackName,
                artistName: pendingThoughtMusic.artistName,
                artworkUrl100: pendingThoughtMusic.artworkUrl100,
                previewUrl: pendingThoughtMusic.previewUrl,
                trackViewUrl: pendingThoughtMusic.trackViewUrl
            };

            renderThoughtMusicSelection();
            closeThoughtMusicPicker();
        }
    );
}

/* CHARACTER COUNTER */

if (noteTextInput) {

noteTextInput.addEventListener(
    "input",
    () => {

        const length =
            noteTextInput.value.length;

        if (noteCharCount) {
            noteCharCount.textContent =
                length;
        }

        if (length > 60) {
            noteTextInput.value =
                noteTextInput.value.slice(0, 60);

            if (noteCharCount) {
                noteCharCount.textContent = "60";
            }
        }

    }
);

}

/* MOOD SELECTION */

if (noteMoodOptions) {

noteMoodOptions
    .querySelectorAll("button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedNoteMood =
                    button.dataset.mood || "";

                noteMoodOptions
                    .querySelectorAll("button")
                    .forEach(item => {
                        item.classList.remove("selected");
                    });

                button.classList.add("selected");

            }
        );

    });

}

/* SAVE NOTE */

async function saveNote() {

    if (!noteTextInput || !saveNoteBtn) {
        return;
    }

    const text =
        noteTextInput.value.trim();

    const audience =
        noteAudienceSelect
            ? noteAudienceSelect.value
            : "public";

    const music =
        selectedThoughtMusic
            ? {
                provider: selectedThoughtMusic.provider || "apple",
                id: selectedThoughtMusic.id || selectedThoughtMusic.trackId,
                title: selectedThoughtMusic.title || selectedThoughtMusic.trackName,
                artist: selectedThoughtMusic.artist || selectedThoughtMusic.artistName,
                artwork: selectedThoughtMusic.artwork || selectedThoughtMusic.artworkUrl100,
                externalUrl: selectedThoughtMusic.externalUrl || selectedThoughtMusic.trackViewUrl,
                trackId: selectedThoughtMusic.trackId,
                trackName: selectedThoughtMusic.trackName,
                artistName: selectedThoughtMusic.artistName,
                artworkUrl100: selectedThoughtMusic.artworkUrl100,
                previewUrl: selectedThoughtMusic.previewUrl,
                trackViewUrl: selectedThoughtMusic.trackViewUrl
            }
            : null;

    if (!text) {

        if (noteComposerMessage) {
            noteComposerMessage.textContent =
                "Please write a thought first.";
        }

        return;
    }

    if (text.length > 60) {

        if (noteComposerMessage) {
            noteComposerMessage.textContent =
                "Thought must be 60 characters or less.";
        }

        return;
    }

    saveNoteBtn.disabled = true;
    saveNoteBtn.textContent = "Updating...";

    try {

        const {
            data: { session },
            error: sessionError
        } =
            await supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session || !session.user) {
            throw new Error("Please login again.");
        }


        /* REMOVE OLD ACTIVE THOUGHT */

        const {
            error: deleteError
        } =
            await supabaseClient
                .from("notes")
                .delete()
                .eq("user_id", session.user.id)
                .gt(
                    "expires_at",
                    new Date().toISOString()
                );

        if (deleteError) {
            throw deleteError;
        }


        /* CREATE NEW THOUGHT */

        const {
            error: insertError
        } =
            await supabaseClient
                .from("notes")
                .insert({
                    user_id: session.user.id,
                    text: text,
                    mood: selectedNoteMood || null,
                    music: music,
                    audience: audience
                });

        if (insertError) {
            throw insertError;
        }


        if (noteComposerMessage) {
            noteComposerMessage.textContent =
                "Thought shared successfully ✓";
        }


        setTimeout(async function () {
            closeNoteComposer();
            const refreshedNote = await loadActiveNotes();
            if (music && refreshedNote) {
                openThoughtMusicSheet(
                    refreshedNote,
                    currentThoughtUsername,
                    currentThoughtAvatarUrl
                );
            }
        }, 500);


    } catch (error) {

        console.error(
            "NOTE SAVE ERROR:",
            error
        );

        if (noteComposerMessage) {
            noteComposerMessage.textContent =
                error.message ||
                "Could not share thought.";
        }

    } finally {

        saveNoteBtn.disabled = false;
        saveNoteBtn.textContent =
            "Update";

    }

}

/* SAVE BUTTON */

if (saveNoteBtn) {

saveNoteBtn.addEventListener(
    "click",
    saveNote
);


}

/* =========================================
DELETE MY NOTE
========================================= */

async function deleteMyNote(noteId) {

if (!noteId) {
    return;
}

try {

    const { error } =
        await supabaseClient
            .from("notes")
            .delete()
            .eq("id", noteId);

    if (error) {
        throw error;
    }

    await loadActiveNotes();

} catch (error) {

    console.error(
        "DELETE MY NOTE ERROR:",
        error
    );
}

}

/* =========================================
LOAD ACTIVE THOUGHTS
========================================= */

async function loadActiveNotes() {

const row =
    document.getElementById(
        "storiesThoughtsRow"
    );

if (!row) {
    return;
}

try {

    /* GET SESSION */

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth.getSession();

    if (sessionError) {
        throw sessionError;
    }

    const session =
        sessionData.session;

    if (!session || !session.user) {
        return;
    }


    /* =====================================
       GET ACTIVE NOTES
       ===================================== */

    const {
        data: notes,
        error: notesError
    } =
        await supabaseClient
            .from("notes")
            .select(`
                id,
                user_id,
                text,
                mood,
                music,
                audience,
                created_at,
                expires_at
            `)
            .gt(
                "expires_at",
                new Date().toISOString()
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (notesError) {
        throw notesError;
    }

    const latestNotesByOwner = new Map();
    (notes || []).forEach(function (note) {
        if (
            note &&
            typeof note.id === "string" &&
            typeof note.user_id === "string" &&
            note.user_id &&
            !latestNotesByOwner.has(note.user_id)
        ) {
            latestNotesByOwner.set(note.user_id, note);
        }
    });
    const activeNotes = Array.from(latestNotesByOwner.values());


    /* =====================================
       YOUR NOTE ITEM
       ===================================== */

    const createItem =
        document.getElementById(
            "createThoughtItem"
        );

    if (!createItem) {
        return;
    }

    if (activeThoughtAudio) {
        activeThoughtAudio.pause();
        activeThoughtAudio = null;
        activeThoughtAudioButton = null;
    }

    /* =====================================
       REMOVE OLD DYNAMIC THOUGHTS
       ===================================== */

    row
        .querySelectorAll(
            ".dynamic-thought-item"
        )
        .forEach(
            item => item.remove()
        );


    /* =====================================
       FIND MY NOTE
       ===================================== */

    const myNote =
        latestNotesByOwner.get(session.user.id) || null;
    activeThoughtEditorNote = myNote || null;


    /* =====================================
       YOUR NOTE
       ===================================== */

    createItem.innerHTML = "";


    /* MY THOUGHT BUBBLE */

    if (myNote) {
        const thoughtContent =
            document.createElement("div");

        thoughtContent.className =
            "thought-note-content";

        const myBubble =
            document.createElement(
                "div"
            );

        myBubble.className =
            "thought-bubble";

        const myBubbleText =
            document.createElement("span");

        myBubbleText.className =
            "thought-text";

        if (myNote.music) {
            myBubble.classList.add("thought-music-note-bubble");
            const musicIcon = document.createElement("span");
            musicIcon.className = "thought-music-note-icon";
            musicIcon.setAttribute("aria-hidden", "true");
            musicIcon.textContent = "♪";
            thoughtContent.appendChild(musicIcon);
            const extras = getThoughtMusicExtras(myNote.music);
            const details = getThoughtMusicDetails(myNote.music);
            myBubbleText.textContent =
                extras.artists.join(", ") || details.artist || details.title;
            myBubble.setAttribute("role", "button");
            myBubble.tabIndex = 0;
            myBubble.setAttribute("aria-label", "Open music Thought");
            myBubble.addEventListener("click", function (event) {
                openThoughtMusicFromUserGesture(
                    myNote,
                    currentThoughtUsername,
                    currentThoughtAvatarUrl,
                    event
                );
            });
            myBubble.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openThoughtMusicFromUserGesture(
                        myNote,
                        currentThoughtUsername,
                        currentThoughtAvatarUrl,
                        event
                    );
                }
            });
        } else {
            myBubbleText.textContent = myNote.text;
        }

        thoughtContent.appendChild(myBubbleText);

        if (myNote.mood && !myNote.music) {
            const moodBadge =
                document.createElement("span");

            moodBadge.className =
                "thought-mood";

            moodBadge.textContent =
                myNote.mood;

            thoughtContent.appendChild(moodBadge);
        }

        myBubble.appendChild(thoughtContent);

        if (!myNote.music) {
            const musicLine =
                createThoughtMusicElement(myNote.music);

            if (musicLine) {
                myBubble.appendChild(musicLine);
            }
        }

        createItem.appendChild(myBubble);

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "your-note-delete-btn";

        deleteButton.textContent =
            "×";

        deleteButton.setAttribute(
            "aria-label",
            "Delete your thought"
        );

        deleteButton.title =
            "Delete your thought";

        deleteButton.addEventListener(
            "click",
            function () {
                deleteMyNote(myNote.id);
            }
        );

        createItem.appendChild(
            deleteButton
        );
    }


    /* =====================================
       MY AVATAR RING
       ===================================== */

    const myRing =
        document.createElement(
            "div"
        );

    myRing.className =
        "thought-avatar-wrapper seen";


    /* =====================================
       MY AVATAR
       ===================================== */

    const myAvatar =
        document.createElement(
            "button"
        );

    myAvatar.type =
        "button";

    myAvatar.id =
        "createThoughtBtn";
    myAvatar.className =
        "thought-avatar your-note-avatar";

    myAvatar.textContent = "";

    if (myNote) {
        myAvatar.classList.add("has-note");
    }

    myAvatar.title =
        myNote
            ? "Create or replace your thought"
            : "Create Thought";

    myAvatar.setAttribute(
        "aria-label",
        myAvatar.title
    );

    myAvatar.addEventListener(
        "click",
        openNoteComposer
    );


    myRing.appendChild(
        myAvatar
    );

    createItem.appendChild(
        myRing
    );


    /* =====================================
       MY NAME
       ===================================== */

    const myName =
        document.createElement(
            "span"
        );

    myName.className =
        "story-username";

    myName.textContent =
        "Your note";

    createItem.appendChild(
        myName
    );


    /* =====================================
       GET USER IDS
       ===================================== */

    const userIds =
        [
            ...new Set(
                [
                    session.user.id,
                    ...activeNotes.map(
                        note =>
                            note.user_id
                    )
                ]
            )
        ];


    /* =====================================
       GET PROFILES
       ===================================== */

    let profiles = [];


    if (userIds.length > 0) {

        const {
            data: profileData,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    username,
                    name,
                    avatar_idx
                `)
                .in(
                    "id",
                    userIds
                );


        if (profileError) {

            console.error(
                "THOUGHT PROFILE ERROR:",
                profileError
            );

        } else {

            profiles =
                profileData || [];
        }
    }


    /* =====================================
       PROFILE MAP
       ===================================== */

    const profileMap = {};


    profiles.forEach(
        profile => {

            profileMap[
                profile.id
            ] = profile;

        }
    );

    const ownProfile =
        profileMap[session.user.id] || {};

    currentThoughtUsername =
        ownProfile.username ||
        ownProfile.name ||
        "Your Note";

    const ownAvatarUrl =
        typeof ownProfile.avatar_idx === "string" &&
        /^https?:\/\//i.test(ownProfile.avatar_idx)
            ? ownProfile.avatar_idx
            : "";
    currentThoughtAvatarUrl = ownAvatarUrl;

    if (thoughtEditorUsername) {
        thoughtEditorUsername.value = currentThoughtUsername;
    }

    myName.textContent = currentThoughtUsername;

    if (ownAvatarUrl) {
        const ownAvatarImage =
            document.createElement("img");

        ownAvatarImage.className =
            "thought-avatar-image";

        ownAvatarImage.src =
            ownAvatarUrl;

        ownAvatarImage.alt =
            "Your profile avatar";

        myAvatar.appendChild(ownAvatarImage);
        myAvatar.classList.add("has-profile-picture");
    } else {
        myAvatar.textContent =
            "+";
    }


    /* =====================================
       OTHER USERS' THOUGHTS
       ===================================== */

    activeNotes.forEach(
        note => {

            /* SKIP MY OWN NOTE */

            if (
                note.user_id ===
                session.user.id
            ) {
                return;
            }


            /* PROFILE */

            const profile =
                profileMap[
                    note.user_id
                ] || {};


            const username =
                profile.username ||
                profile.name ||
                "User";


            /* =================================
               ITEM
               ================================= */

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "inware-thought-item dynamic-thought-item";


            /* =================================
               THOUGHT BUBBLE
               ================================= */

            const bubble =
                document.createElement(
                    "div"
                );

            const thoughtContent =
                document.createElement("div");

            thoughtContent.className =
                "thought-note-content";

            bubble.className =
                "thought-bubble";

            const bubbleText =
                document.createElement("span");

            bubbleText.className =
                "thought-text";

            if (note.music) {
                bubble.classList.add("thought-music-note-bubble");
                const musicIcon =
                    document.createElement("span");

                musicIcon.className =
                    "thought-music-note-icon";
                musicIcon.setAttribute("aria-hidden", "true");
                musicIcon.textContent = "♪";
                thoughtContent.appendChild(musicIcon);

                const extras = getThoughtMusicExtras(note.music);
                const details = getThoughtMusicDetails(note.music);
                bubbleText.textContent =
                    extras.artists.join(", ") || details.artist || details.title;
                bubble.setAttribute("role", "button");
                bubble.tabIndex = 0;
                bubble.setAttribute("aria-label", `Open ${username}'s music Thought`);

                const openSheet = function (event) {
                    openThoughtMusicFromUserGesture(
                        note,
                        username,
                        avatarUrl,
                        event
                    );
                };
                bubble.addEventListener("click", openSheet);
                bubble.addEventListener("keydown", function (event) {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openSheet();
                    }
                });
            } else {
                bubbleText.textContent = note.text;
            }

            thoughtContent.appendChild(bubbleText);

            if (note.mood && !note.music) {
                const moodBadge =
                    document.createElement("span");

                moodBadge.className =
                    "thought-mood";

                moodBadge.textContent =
                    note.mood;

                thoughtContent.appendChild(moodBadge);
            }

            bubble.appendChild(thoughtContent);

            if (!note.music) {
                const musicLine =
                    createThoughtMusicElement(note.music);

                if (musicLine) {
                    bubble.appendChild(musicLine);
                }
            }



            /* =================================
               AVATAR RING
               ================================= */

            const avatarRing =
                document.createElement(
                    "div"
                );

            avatarRing.className =
                "thought-avatar-wrapper";


            /* =================================
   AVATAR
   ================================= */

const avatar =
    document.createElement(
        "div"
    );

avatar.className =
    "thought-avatar";


/* =================================
   PROFILE AVATAR INDEX
   ================================= */

const avatarUrl =
    typeof profile.avatar_idx === "string" &&
    /^https?:\/\//i.test(profile.avatar_idx)
        ? profile.avatar_idx
        : "";

if (avatarUrl) {
    const avatarImage =
        document.createElement("img");

    avatarImage.className =
        "thought-avatar-image";

    avatarImage.src =
        avatarUrl;

    avatarImage.alt =
        `${username} avatar`;

    avatar.appendChild(avatarImage);
} else {
    avatar.textContent =
        username
            .charAt(0)
            .toUpperCase();
}

            avatarRing.appendChild(
                avatar
            );


            /* =================================
               USERNAME
               ================================= */

            const name =
                document.createElement(
                    "span"
                );

            name.className =
                "story-username";

            name.textContent =
                username;


            /* =================================
               BUILD ITEM
               ================================= */

            item.appendChild(
                bubble
            );

            item.appendChild(
                avatarRing
            );

            item.appendChild(
                name
            );

            row.appendChild(
                item
            );

        }
    );

    return myNote || null;

} catch (error) {

    console.error(
        "THOUGHT LOAD ERROR:",
        error
    );
}

}

/* =========================================
LOAD THOUGHTS ON PAGE LOAD
========================================= */

loadActiveNotes();