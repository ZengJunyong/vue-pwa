// import { ZegoClient } from "webrtc-zego";
import Vue from "vue";

const config = require("../config/zego.config.dev");

function getBrowser() {
    var ua = window.navigator.userAgent;
    var isIE = window.ActiveXObject != undefined && ua.indexOf("MSIE") != -1;
    var isFirefox = ua.indexOf("Firefox") != -1;
    var isOpera = window.opr != undefined;
    var isChrome = ua.indexOf("Chrome") && window.chrome;
    var isSafari = ua.indexOf("Safari") != -1 && ua.indexOf("Version") != -1;
    if (isIE) {
        return "IE";
    } else if (isFirefox) {
        return "Firefox";
    } else if (isOpera) {
        return "Opera";
    } else if (isChrome) {
        return "Chrome";
    } else if (isSafari) {
        return "Safari";
    } else {
        return "Unkown";
    }
}


function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}

function enumDevices() {
    var audioInputList = [], videoInputList = [];
    zg.enumDevices(deviceInfo => {
        console.log("enumDevices", deviceInfo);
        device = deviceInfo;
    }, function (error) {
        console.error("enum device error: " + error);
    });
}

var zg,
    appid = config.appid,
    _config = config._config,
    _otherConfig = config._otherConfig,
    loginRoom = false,
    previewVideo,
    screenAudio,
    remoteVideos,
    remoteAudios,
    screenCaptrue,
    isPreviewed = false,
    useLocalStreamList = [],
    useLocalStreamAudioList = [];
var anchor_userid = "", anchro_username = "";
var device;
var openRoomCallBack, onStreamUpdatedCallBack;

function leaveRoom() {
    console.info("leave room  and close stream");

    if (isPreviewed) {
        zg.stopPreview(previewVideo);
        zg.stopPublishingStream(_config.idName);
        isPreviewed = false;
    }

    for (var i = 0; i < useLocalStreamList.length; i++) {
        zg.stopPlayingStream(useLocalStreamList[i].stream_id);
    }

    for (var i = 0; i < useLocalStreamAudioList.length; i++) {
        zg.stopPlayingStream(useLocalStreamAudioList[i].stream_id);
    }

    useLocalStreamList = [];
    useLocalStreamAudioList = [];
    zg.logout();
}

function listen() {
    var _config = {
        onStreamUpdated: function (type, streamList) {
            console.log("onStreamUpdated", type, streamList);
            if (type == 0) {
                let len = useLocalStreamList.length;
                let len2 = useLocalStreamAudioList.length;
                let lenVideo = 0;
                let lenAudio = 0;
                for (let i = 0; i < streamList.length; i++) {
                    console.info(streamList[i].stream_id + " was added");
                    if (streamList[i].stream_id.charAt(0) === "v") {
                        useLocalStreamList.push(streamList[i]);
                        play(streamList[i].stream_id, remoteVideos[len + lenVideo]);
                        lenVideo++;
                    } else {
                        useLocalStreamAudioList.push(streamList[i]);
                        playAudio(streamList[i].stream_id, remoteAudios[len2 + lenAudio]);
                        lenAudio++;
                    }
                }
                onStreamUpdatedCallBack(len + lenVideo);
            } else if (type == 1) {
                let renderVFlag = false;
                for (var k = 0; k < useLocalStreamList.length; k++) {
                    for (var j = 0; j < streamList.length; j++) {
                        if (useLocalStreamList[k].stream_id === streamList[j].stream_id) {
                            zg.stopPlayingStream(useLocalStreamList[k].stream_id);
                            console.info(useLocalStreamList[k].stream_id + " was devared");
                            useLocalStreamList.splice(k, 1);
                            renderVFlag = true;
                            break;
                        }
                    }
                }
                if (renderVFlag) {
                    renderRemoteVideos();
                }
                let renderAFlag = false;
                for (var k = 0; k < useLocalStreamAudioList.length; k++) {
                    for (var j = 0; j < streamList.length; j++) {
                        if (useLocalStreamAudioList[k].stream_id === streamList[j].stream_id) {
                            zg.stopPlayingStream(useLocalStreamAudioList[k].stream_id);
                            console.info(useLocalStreamAudioList[k].stream_id + " was devared");
                            useLocalStreamAudioList.splice(k, 1);
                            renderAFlag = true;
                            break;
                        }
                    }
                }
                if (renderAFlag) {
                    renderRemoteAudios();
                }
            }
        }
    };

    for (var key in _config) {
        zg[key] = _config[key];
    }
}

function init() {

    zg = new ZegoClient();
    zg.setUserStateUpdate(true);//重要  启动用户变化监听
    console.log(_config);
    zg.config(_config);
    enumDevices();

    listen();
}

/*
    roomId, type 请参考 zepo 的文档
    video 表示将视频渲染到本地的DOM
    callback 通知 vue ，zg 这边完成了
 */
function openRoom(roomId, type, video, rVideos, rAudios, callback1, callback2) {

    previewVideo = video;
    remoteVideos = rVideos;
    remoteAudios = rAudios;
    openRoomCallBack = callback1;
    onStreamUpdatedCallBack = callback2;

    if (!roomId) {
        alert("请输入房间号");
        return;
    }

    screenCaptrue && zg.stopScreenShot();

    //get token
    Vue.http.get(_otherConfig.token, {
        params: {
            app_id: _config.appid,
            id_name: _config.idName,
            cgi_token: _otherConfig.cgi_token
        }
    }).then(
        (res) => {
            console.log("gettoken success");
            startLogin(roomId, res.data, type);
        });
}

//login
function startLogin(roomId, token, type) {
    zg.login(roomId, type, token, function (streamList) {
        console.log("login success");
        loginSuccess(streamList, type);
    }, function (err) {
        loginFailed(err);
    });
}


function loginFailed(err) {
    alert("登录失败");
    console.error(err);

}

function renderRemoteVideos() {
    // 界面上的2，3，4...为远程用户，如果有人退出，重排列
    let len = useLocalStreamList.length;
    for (let i = 0; i < len; i++) {
        zg.stopPlayingStream(useLocalStreamList[i].stream_id);
    }
    for (let i = 0; i < len; i++) {
        play(useLocalStreamList[i].stream_id, remoteVideos[i]);
    }
    onStreamUpdatedCallBack(len);
}

function renderRemoteAudios() {
    let len = useLocalStreamAudioList.length;
    for (let i = 0; i < len; i++) {
        zg.stopPlayingStream(useLocalStreamAudioList[i].stream_id);
    }
    for (let i = 0; i < len; i++) {
        playAudio(useLocalStreamAudioList[i].stream_id, remoteAudios[i]);
    }
}

function loginSuccess(streamList, type) {
    var maxNumber = 20;

    //限制房间最多人数，原因：视频软解码消耗cpu，浏览器之间能支撑的个数会有差异，太多会卡顿
    if (streamList.length >= maxNumber) {
        alert("房间太拥挤，换一个吧！");
        leaveRoom();
        return;
    }
    // useLocalStreamList = streamList;

    streamList.forEach((s) => {
        if (s.stream_id.charAt(0) === "v") {
            useLocalStreamList.push(s);
        } else {
            useLocalStreamAudioList.push(s);
        }
    });

    renderRemoteVideos();
    renderRemoteAudios();
    console.log(`login success`);

    loginRoom = true;

    //开始预览本地视频
    type === 1 && doPreviewPublish();

}

//预览
function doPreviewPublish(config) {
    var quality = 2;

    var previewConfig = {
        "audio": true,
        "audioInput": device.microphones[0].deviceId || null,
        "video": true,
        "facingMode": "user",
        // "videoInput": device.cameras[0].deviceId || null,
        "videoQuality": quality * 1,
        "horizontal": true,
        "externalCapture": false,
        "externalMediaStream": null
    };
    previewConfig = Vue.util.extend(previewConfig, config);
    console.log("previewConfig", previewConfig);
    var result = zg.startPreview(previewVideo, previewConfig, function () {
        console.log("preview success");
        openRoomCallBack();
        isPreviewed = true;
        publish();
        //部分浏览器会有初次调用摄像头后才能拿到音频和视频设备label的情况，
        enumDevices();
    }, function (err) {
        alert(JSON.stringify(err));
        console.error("preview failed", err);
    });

    if (!result) alert("预览失败！");
}

//预览
function doPreviewPublishAudio(config) {
    var quality = 2;

    var previewConfig = {
        "audio": true,
        "audioInput": device.microphones[0].deviceId || null,
        "video": false,
        "videoInput": device.cameras[0].deviceId || null,
        "videoQuality": quality * 1,
        "horizontal": true,
        "externalCapture": false,
        "externalMediaStream": null
    };
    previewConfig = Vue.util.extend(previewConfig, config);
    console.log("previewConfig", previewConfig);
    screenAudio = document.getElementById("screenAudio");
    screenAudio.muted = true;
    var result = zg.startPreview(screenAudio, previewConfig, function () {
        console.log("preview audio success");
        publishAudio();
    }, function (err) {
        alert(JSON.stringify(err));
        console.error("preview failed", err);
    });

    if (!result) alert("预览失败！");
}

//推流
function publish() {
    zg.startPublishingStream(_config.idName, previewVideo);
}

//推流
function publishAudio() {
    zg.startPublishingStream(_config.idAudioName, screenAudio);
}

function play(streamId, video) {
    var result = zg.startPlayingStream(streamId, video);

    video.muted = false;
    if (!result) {
        alert("哎呀，播放失败啦");
        video.style = "display:none";
    }
}

function playAudio(streamId, video) {
    var result = zg.startPlayingStream(streamId, video, null, {playType: "audio"});

    video.muted = false;
    if (!result) {
        alert("哎呀，播放失败啦");
        video.style = "display:none";
    }
}

function enableCamera(enable) {
    zg.enableCamera(previewVideo, enable);
}

function enableMicrophone(enable) {
    zg.enableMicrophone(previewVideo, enable);
}

var isSupportShareScreen = IsPC() && (getBrowser() === "Chrome" || getBrowser() === "Firefox");

function enableScreen(enable) {
    if (enable) {
        loginRoom && zg.stopPublishingStream(_config.idName);
        loginRoom && zg.stopPreview(previewVideo);

        getBrowser() === "Firefox" && zg.startScreenShotFirFox("window", false, function (suc, mediastream) {
            console.log("startScreenShot:" + suc);
            screenCaptrue = suc;
            previewVideo.srcObject = mediastream;
            // 推送屏幕可有两种形式，一是作为流媒体直接推送 即下面这种形式
            //另一种是作为externalCapture，前提是需要先将流喂给video标签；，下面chrome推送方式就是这种形式；可任意选择其中之一
            if (loginRoom) {
                doPreviewPublish({
                    externalMediaStream: null,
                    width: 640,
                    height: 480,
                    frameRate: 15,
                    bitRate: 1000
                });
                doPreviewPublishAudio({"audio": false});
            }
        });

        getBrowser() === "Chrome" && zg.startScreenShotChrome(function (suc, mediastream) {
            console.log("startScreenShot:" + suc);
            screenCaptrue = suc;
            // 推送屏幕可有两种形式，一是作为externalCapture，前提是需要先将流喂给video标签；即下面这种形式
            //另一种是作为流媒体直接推送，上面火狐推送方式就是这种形式；可任意选择其中之一
            previewVideo.srcObject = mediastream;
            if (loginRoom) {
                doPreviewPublish({externalCapture: true, "audio": false});
                doPreviewPublishAudio();
            }
        });
    } else {
        zg.stopScreenShot();
        zg.stopPreview(previewVideo);
        zg.stopPublishingStream(_config.idName);
        doPreviewPublish();

        zg.stopPreview(screenAudio);
        zg.stopPublishingStream(_config.idAudioName);
    }
}

console.log("sdk version is", ZegoClient.getCurrentVersion());
if (ZegoClient.isSupportWebrtc()) {
    ZegoClient.isSupportH264(result => {
        init();
        if (!result) {
            alert("浏览器不支持视频h264编码，不能推拉音频流");
        }
    }, err => {
        console.error(err);
    });
} else {
    alert("浏览器不支持webrtc，换一个浏览器试试吧");
}

export default {
    zg,
    openRoom,
    enableCamera,
    enableMicrophone,
    isSupportShareScreen,
    enableScreen,
    leaveRoom
};
