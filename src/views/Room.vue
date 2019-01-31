<template>
    <div class="container flex">
        <div class="room" :class="lengthOfRemoteVideo<=3?'':'scroll'">
            <div class="video flex-center" :class="previewVideo?'':'opacity55'">
                <video v-show="previewVideo" id="previewVideo" muted autoplay playsinline controls></video>
                <img v-show="!previewVideo" src="static/roomset_1.png" alt="">
            </div>
            <div class="video flex-center" v-show="lengthOfRemoteVideo<=3? i<3: i<lengthOfRemoteVideo"
                 :class="r?'':'opacity55'"
                 v-for="(r,i) in remoteVideo">
                <video v-show="r" class="remoteVideo" autoplay playsinline controls></video>
                <img v-show="!r" :src="'static/roomset_' + (i+2) + '.png'" alt="">
            </div>
        </div>
        <div class="bottom">
            <div>
                <div @click="toggleCamera">
                    <img src="static/camera.png" alt="">
                    <div class="circle">
                        <i :class="enableCamera?'green':'red'"></i>
                        {{enableCamera?"关闭视频":"开启视频"}}
                    </div>
                </div>
                <div @click="toggleMic">
                    <img src="static/mic.png" alt="">
                    <div class="circle">
                        <i :class="enableMic?'green':'red'"></i>
                        {{enableMic?"关闭声音":"开启声音"}}
                    </div>
                </div>
                <div v-if="isSupportShareScreen" @click="toggleScreen">
                    <img :src="'static/screen' + (enableScreen ? '-dis' : '')  + '.png'" alt="">
                    {{enableScreen?"关闭分享":"屏幕分享"}}
                </div>
            </div>
            <div>
                <div @click="copyToClipboard">
                    <img src="static/link.png" alt="">
                    复制链接
                </div>
                <div>
                    <img src="static/invite.png" alt="">
                    邀请朋友
                </div>
                <div class="red" @click="endMeeting()">
                    <img src="static/end-meeting.png" alt="">
                    结束会议
                </div>
                <div>
                    <span class="flex-center">{{room}}</span>
                    会议编号
                </div>
            </div>
            <div class="none">
                <audio id="screenAudio" autoplay muted playsinline></audio>
                <audio v-for="r in remoteVideo" class="remoteAudio" autoplay playsinline></audio>
            </div>
        </div>
    </div>
</template>

<script>
    import zg from "@/utils/zego";

    export default {
        name: "room",
        data() {
            return {
                previewVideo: false,
                remoteVideo: [false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, false],
                lengthOfRemoteVideo: 0,
                enableCamera: true,
                enableMic: true,
                enableScreen: false
            };
        },
        beforeCreate() {
            // Safari on Iphone 上有一个bug，跳转到 room 页面，要强制刷新一下，WebRTC才可使用
            if (this.$route.params.isSafariOnIphone) {
                location.reload(true)
            }
        },
        mounted() {
            zg.openRoom(
                this.room, 1,
                document.getElementById("previewVideo"),
                document.querySelectorAll(".remoteVideo"),
                document.querySelectorAll(".remoteAudio"),
                () => {
                    this.previewVideo = true;
                    if (this.$route.query.video === "0") {
                        this.toggleCamera();
                    }
                },
                (len) => {
                    this.lengthOfRemoteVideo = len;
                    for (let i = 0; i < this.remoteVideo.length; i++) {
                        this.remoteVideo.splice(i, 1, i < len);
                    }
                });
        },
        computed: {
            room() {
                return this.$route.query.room + "";
            },
            isSupportShareScreen() {
                return zg.isSupportShareScreen; // 屏幕分享功能只支持桌面系统的Chrome或者Firefox浏览器
            }
        },
        methods: {
            toggleCamera() {
                this.enableCamera = !this.enableCamera;
                zg.enableCamera(this.enableCamera);
            },
            toggleMic() {
                this.enableMic = !this.enableMic;
                zg.enableMicrophone(this.enableMic);
            },
            toggleScreen() {
                this.enableScreen = !this.enableScreen;
                zg.enableScreen(this.enableScreen);
            },
            copyToClipboard() {
                let str = "您好，快来加入视频会议吧，我在这儿等你：" + location.origin + "#/room?room=" + this.room;
                // https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
                const el = document.createElement("textarea");
                el.value = str;
                el.setAttribute("readonly", "");
                el.style.position = "absolute";
                el.style.left = "-9999px";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                alert("会议的链接已经复制到剪贴板，请通过邮件，微信等发送给他人即可加入该会议。");
            },
            endMeeting() {
                zg.leaveRoom();
                this.$router.push({name: "index"});
            }
        }
    };
</script>

<style scoped lang="scss">
    $margin: 2px;
    $bottomHeight: 80px;

    .container {
        height: 100%;
        background: black;
        color: white;
    }

    .flex {
        display: flex;
        flex-direction: column;
    }


    .scroll {
        overflow: scroll;
    }

    .room {
        flex-grow: 1;
        padding: 12px 12px 0 12px;
        display: flex;
        flex-wrap: wrap;
        height: calc(100% - #{$bottomHeight});


        .video {
            width: calc(50% - #{$margin});
            height: 50%;
            background-color: #333333;
            background-image: url(https://mc.qcloudimg.com/static/img/7da57e0050d308e2e1b1e31afbc42929/bg.png);
            background-repeat: no-repeat;
            background-size: cover;
            margin-bottom: 6px;

            &:nth-child(odd) {
                margin-right: $margin;
            }

            &:nth-child(even) {
                margin-left: $margin;
            }

            video {
                width: 100%;
                height: 100%;
            }

            img {
                width: 30px;
            }
        }

        .opacity55 {
            opacity: 0.75;
        }

    }

    .bottom {
        height: $bottomHeight;
        display: flex;
        justify-content: space-between;
        padding: 0 12px;

        div {
            display: flex;
            align-items: center;

            > div {
                padding-top: 8px;
                flex-direction: column;
                font-size: 12px;

                img {
                    width: 30px;
                    margin-bottom: 4px;
                }
            }
        }

        > div:first-child {
            flex-grow: 1;

            div {
                margin-right: 30px;
            }

            .circle {
                margin: 0;
                flex-direction: row;
                padding: 0;

                i {
                    width: 10px;
                    height: 10px;
                    border-radius: 5px;
                    margin-right: 4px;
                }

                i.red {
                    background: #cc1525;
                }

                i.green {
                    background: #83d13c;
                }
            }
        }

        > div:nth-child(2) {
            div {
                margin-left: 30px;
            }
        }

        span {
            width: 100%;
            height: 30px;
            background: white;
            padding: 0 5px;
            margin-bottom: 4px;
            color: black;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
        }
    }

    .none {
        display: none;
    }

</style>
