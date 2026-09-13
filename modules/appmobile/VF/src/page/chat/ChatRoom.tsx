import React, { useState, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    ScrollView,
    Modal,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const EMOJI_LIST = ["❤️", "👍", "🔥", "😂", "😮", "😢"];

// Dữ liệu tin nhắn khởi tạo
const DEFAULT_MESSAGES = [
    {
        id_tin_nhan: 1,
        id_nguoi_gui: 2, // HLV Tuấn Anh
        loai_tin_nhan: "VAN_BAN",
        noi_dung: "Chào Nam! Thầy vừa xem video bài Squat hôm qua hệ thống VisionFit AI chấm điểm.",
        trang_thai: "DA_GUI",
        thoi_gian_gui: "09:25",
        reactions: ["🔥"],
    },
    {
        id_tin_nhan: 2,
        id_nguoi_gui: 2,
        loai_tin_nhan: "HINH_ANH",
        noi_dung: "Góc nghiêng lưng dưới ở Rep 4 và 5 hơi cong khoảng 8 độ. Thầy khoanh tròn chỗ này nhé:",
        media_url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80",
        trang_thai: "DA_GUI",
        thoi_gian_gui: "09:26",
    },
    {
        id_tin_nhan: 3,
        id_nguoi_gui: 1, // Nam (Current user)
        id_tin_nhan_tra_loi: 2,
        tra_loi_noi_dung: "Góc nghiêng lưng dưới ở Rep 4 và 5 hơi cong...",
        tra_loi_nguoi_gui: "HLV Tuấn Anh",
        loai_tin_nhan: "VAN_BAN",
        noi_dung: "Dạ em cảm ơn thầy! Đến rep cuối em hơi đuối nên gồng bụng chưa đủ chặt.",
        trang_thai: "DA_GUI",
        thoi_gian_gui: "09:30",
        reactions: ["👍"],
    },
    {
        id_tin_nhan: 4,
        id_nguoi_gui: 2,
        loai_tin_nhan: "VAN_BAN",
        noi_dung: "Tin nhắn đã được thu hồi",
        trang_thai: "DA_THU_HOI",
        thoi_gian_gui: "09:35",
    },
    {
        id_tin_nhan: 5,
        id_nguoi_gui: 2,
        loai_tin_nhan: "LICH_TAP",
        noi_dung: "Đề xuất buổi tập PT 1:1 cùng HLV Tuấn Anh",
        workout: {
            ten_bai_tap: "Ngực vát trên & Tay sau (Chest & Triceps)",
            ngay_tap: "Thứ Tư, 16/09/2026",
            gio_tap: "18:00 - 19:15",
            calo_muc_tieu: 480,
        },
        trang_thai: "DA_GUI",
        thoi_gian_gui: "10:41",
        reactions: ["❤️"],
    },
    {
        id_tin_nhan: 6,
        id_nguoi_gui: 2,
        loai_tin_nhan: "VAN_BAN",
        noi_dung: "Em bấm Xác nhận lịch tập trên thẻ ở trên để hệ thống giữ máy tập nhé!",
        trang_thai: "DA_GUI",
        thoi_gian_gui: "10:42",
    },
];

const ChatRoom = ({ navigation, route }: any) => {
    const conversation = route?.params?.conversation || {
        id_cuoc_tro_chuyen: 1,
        loai: "TRUC_TIEP",
        doi_phuong: {
            id_nguoi_dung: 2,
            ho_ten: "HLV Tuấn Anh",
            chuyen_mon: "Chuyên gia Tăng cơ & Thể hình cá nhân",
            anh_dai_dien: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80",
            vai_tro: "HUAN_LUYEN_VIEN",
            online: true,
        },
    };
    const currentUser = route?.params?.currentUser || {
        id_nguoi_dung: 1,
        ho_ten: "Lê Hoàng Nam",
    };

    const isGroup = conversation.loai === "NHOM";
    const partner = conversation.doi_phuong;
    const displayName = isGroup ? conversation.ten_nhom : partner?.ho_ten || "HLV Tuấn Anh";
    const displayAvatar = isGroup
        ? conversation.anh_nhom || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80"
        : partner?.anh_dai_dien || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80";

    const [messages, setMessages] = useState<any[]>(DEFAULT_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedMsgForReaction, setSelectedMsgForReaction] = useState<any>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [confirmedWorkout, setConfirmedWorkout] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    // Gửi tin nhắn mới
    const handleSend = (text: string, type: string = "VAN_BAN", mediaUrl?: string, workoutData?: any) => {
        if (!text.trim() && !mediaUrl && type === "VAN_BAN") return;

        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

        const newMsg: any = {
            id_tin_nhan: Date.now(),
            id_nguoi_gui: currentUser.id_nguoi_dung,
            loai_tin_nhan: type,
            noi_dung: text,
            media_url: mediaUrl,
            workout: workoutData,
            trang_thai: "DA_GUI",
            thoi_gian_gui: time,
            da_xem: false,
        };

        if (replyingTo) {
            newMsg.id_tin_nhan_tra_loi = replyingTo.id_tin_nhan;
            newMsg.tra_loi_noi_dung = replyingTo.noi_dung;
            newMsg.tra_loi_nguoi_gui = replyingTo.id_nguoi_gui === currentUser.id_nguoi_dung ? "Bạn" : partner?.ho_ten;
        }

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        setReplyingTo(null);

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Giả lập HLV phản hồi sau 2s
        if (!isGroup && type === "VAN_BAN") {
            setTimeout(() => setIsTyping(true), 800);
            setTimeout(() => {
                setIsTyping(false);
                const reply = {
                    id_tin_nhan: Date.now() + 1,
                    id_nguoi_gui: partner?.id_nguoi_dung || 2,
                    loai_tin_nhan: "VAN_BAN",
                    noi_dung: "HLV đã nhận được tin nhắn của Nam, cố gắng duy trì phong độ nhé! 💪",
                    trang_thai: "DA_GUI",
                    thoi_gian_gui: time,
                };
                setMessages((prev) => [...prev, reply]);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }, 2500);
        }
    };

    // Chọn ảnh từ thư viện bằng react-native-image-picker
    const handlePickImage = async () => {
        try {
            const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
            if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
                handleSend("Đã gửi một hình ảnh", "HINH_ANH", result.assets[0].uri);
            }
        } catch (e) {
            // Dùng ảnh mẫu nếu thiết bị không hỗ trợ picker
            handleSend(
                "Em gửi ảnh bữa ăn trưa theo chế độ đạm cao:",
                "HINH_ANH",
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
            );
        }
    };

    // Thả reaction
    const handleAddReaction = (msgId: number, emoji: string) => {
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id_tin_nhan !== msgId) return m;
                const reactions = m.reactions || [];
                const hasReacted = reactions.includes(emoji);
                return {
                    ...m,
                    reactions: hasReacted ? reactions.filter((r: string) => r !== emoji) : [...reactions, emoji],
                };
            })
        );
        setSelectedMsgForReaction(null);
    };

    // Thu hồi tin nhắn
    const handleRecall = (msgId: number) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.id_tin_nhan === msgId
                    ? { ...m, trang_thai: "DA_THU_HOI", noi_dung: "Tin nhắn đã được thu hồi", media_url: null, workout: null }
                    : m
            )
        );
        setSelectedMsgForReaction(null);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <StatusBar barStyle="dark-content" backgroundColor="#EAF9FB" translucent={false}/>

            {/* Header phòng chat */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#075E68" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerUserInfo} activeOpacity={0.7} onPress={() => setShowInfoModal(true)}>
                    <View style={styles.headerAvatarWrap}>
                        <Image source={{ uri: displayAvatar }} style={styles.headerAvatar} />
                        {!isGroup && partner?.online && <View style={styles.headerOnlineDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                            <Text style={styles.headerStatus}>
                                {isGroup ? "Nhóm 8 thành viên" : partner?.online ? "Đang hoạt động" : "Hoạt động gần đây"}
                            </Text>
                            {partner?.vai_tro === "HUAN_LUYEN_VIEN" && (
                                <View style={styles.headerPtTag}>
                                    <Text style={styles.headerPtTagText}>HLV</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerActionBtn} onPress={() => Alert.alert("Cuộc gọi thoại", `Đang gọi thoại tới ${displayName}...`)}>
                        <Ionicons name="call" size={20} color="#0D7F8D" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.headerActionBtn} onPress={() => Alert.alert("Cuộc gọi Video", `Đang kết nối video call với ${displayName}...`)}>
                        <Ionicons name="videocam" size={21} color="#0D7F8D" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowInfoModal(true)}>
                        <Ionicons name="information-circle" size={22} color="#0D7F8D" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Khung tin nhắn */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id_tin_nhan.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messagesList}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    renderItem={({ item }) => {
                        const isSender = item.id_nguoi_gui === currentUser.id_nguoi_dung;
                        const isRecalled = item.trang_thai === "DA_THU_HOI";

                        return (
                            <View style={[styles.msgRow, isSender ? styles.msgRowSender : styles.msgRowReceiver]}>
                                {!isSender && <Image source={{ uri: displayAvatar }} style={styles.msgAvatar} />}

                                <View style={styles.msgBubbleWrap}>
                                    {/* Trích dẫn trả lời */}
                                    {item.tra_loi_noi_dung && (
                                        <View style={[styles.replyBox, isSender ? styles.replyBoxSender : styles.replyBoxReceiver]}>
                                            <View style={styles.replyLine} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.replyAuthor}>{item.tra_loi_nguoi_gui}</Text>
                                                <Text style={styles.replyText} numberOfLines={1}>
                                                    {item.tra_loi_noi_dung}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Bong bóng tin nhắn */}
                                    <TouchableOpacity
                                        style={[
                                            styles.bubble,
                                            isSender ? styles.bubbleSender : styles.bubbleReceiver,
                                            isRecalled && styles.bubbleRecalled,
                                        ]}
                                        activeOpacity={0.85}
                                        onLongPress={() => setSelectedMsgForReaction(item)}
                                    >
                                        {isRecalled ? (
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <Ionicons name="ban" size={16} color="#71949A" style={{ marginRight: 6 }} />
                                                <Text style={styles.recalledText}>Tin nhắn đã được thu hồi</Text>
                                            </View>
                                        ) : (
                                            <>
                                                {/* Ảnh */}
                                                {item.media_url && (
                                                    <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewImage(item.media_url)}>
                                                        <Image source={{ uri: item.media_url }} style={styles.bubbleImage} />
                                                    </TouchableOpacity>
                                                )}

                                                {/* Thẻ lịch tập thể hình */}
                                                {item.loai_tin_nhan === "LICH_TAP" && item.workout && (
                                                    <View style={styles.workoutCard}>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <View style={styles.workoutIconWrap}>
                                                                <Ionicons name="barbell" size={18} color="#FFFFFF" />
                                                            </View>
                                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                                <Text style={styles.workoutTag}>BUỔI TẬP VISIONFIT</Text>
                                                                <Text style={styles.workoutTitle}>{item.workout.ten_bai_tap}</Text>
                                                            </View>
                                                        </View>

                                                        <View style={styles.workoutDivider} />

                                                        <View style={{ marginBottom: 10 }}>
                                                            <View style={styles.workoutDetailRow}>
                                                                <Ionicons name="calendar-outline" size={14} color="#0D7F8D" />
                                                                <Text style={styles.workoutDetailText}>{item.workout.ngay_tap}</Text>
                                                            </View>
                                                            <View style={styles.workoutDetailRow}>
                                                                <Ionicons name="time-outline" size={14} color="#0D7F8D" />
                                                                <Text style={styles.workoutDetailText}>{item.workout.gio_tap}</Text>
                                                            </View>
                                                            <View style={styles.workoutDetailRow}>
                                                                <Ionicons name="flame-outline" size={14} color="#FA3E3E" />
                                                                <Text style={styles.workoutDetailText}>Mục tiêu: {item.workout.calo_muc_tieu} kcal</Text>
                                                            </View>
                                                        </View>

                                                        <TouchableOpacity
                                                            style={[styles.confirmBtn, confirmedWorkout && styles.confirmedBtn]}
                                                            onPress={() => {
                                                                setConfirmedWorkout(true);
                                                                Alert.alert("Thành công", "Đã lưu lịch tập vào Lịch tập luyện cá nhân của bạn!");
                                                            }}
                                                        >
                                                            <Ionicons name={confirmedWorkout ? "checkmark-circle" : "calendar"} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                                            <Text style={styles.confirmBtnText}>{confirmedWorkout ? "Đã xác nhận lịch" : "Xác nhận lịch tập"}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}

                                                {/* Text */}
                                                {item.noi_dung ? (
                                                    <Text style={[styles.bubbleText, isSender ? styles.bubbleTextSender : styles.bubbleTextReceiver]}>
                                                        {item.noi_dung}
                                                    </Text>
                                                ) : null}
                                            </>
                                        )}

                                        {/* Reactions */}
                                        {item.reactions && item.reactions.length > 0 && (
                                            <View style={[styles.reactionBadge, isSender ? { right: 8 } : { left: 8 }]}>
                                                {item.reactions.map((r: string, idx: number) => (
                                                    <Text key={idx} style={{ fontSize: 12 }}>
                                                        {r}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* Thời gian */}
                                    <View style={[styles.timeRow, isSender ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }]}>
                                        <Text style={styles.timeText}>{item.thoi_gian_gui}</Text>
                                        {isSender && (
                                            <Ionicons
                                                name={item.da_xem ? "checkmark-done" : "checkmark"}
                                                size={13}
                                                color={item.da_xem ? "#0D7F8D" : "#71949A"}
                                                style={{ marginLeft: 4 }}
                                            />
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    ListFooterComponent={
                        isTyping ? (
                            <View style={[styles.msgRow, styles.msgRowReceiver, { marginBottom: 12 }]}>
                                <Image source={{ uri: displayAvatar }} style={styles.msgAvatar} />
                                <View style={[styles.bubble, styles.bubbleReceiver, styles.typingBubble]}>
                                    <View style={styles.typingDot} />
                                    <View style={[styles.typingDot, { opacity: 0.7 }]} />
                                    <View style={[styles.typingDot, { opacity: 0.4 }]} />
                                </View>
                            </View>
                        ) : undefined
                    }
                />

                {/* Thanh nhập tin nhắn Messenger */}
                <View style={styles.toolbar}>
                    {/* Banner trả lời */}
                    {replyingTo && (
                        <View style={styles.replyBanner}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.replyBannerTitle}>
                                    Đang trả lời <Text style={{ fontWeight: "bold" }}>{replyingTo.id_nguoi_gui === currentUser.id_nguoi_dung ? "chính bạn" : partner?.ho_ten}</Text>
                                </Text>
                                <Text style={styles.replyBannerText} numberOfLines={1}>
                                    {replyingTo.noi_dung}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <Ionicons name="close" size={18} color="#71949A" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Menu đính kèm nhanh */}
                    {showAttachMenu && (
                        <View style={styles.attachMenu}>
                            <TouchableOpacity
                                style={styles.attachItem}
                                onPress={() => {
                                    setShowAttachMenu(false);
                                    handleSend("Đề xuất bài tập bổ trợ", "LICH_TAP", undefined, {
                                        ten_bai_tap: "Cardio HIIT Đốt mỡ cuối buổi (Tabata 15 phút)",
                                        ngay_tap: "Hôm nay",
                                        gio_tap: "19:30",
                                        calo_muc_tieu: 220,
                                    });
                                }}
                            >
                                <View style={[styles.attachIconWrap, { backgroundColor: "#DFF6F8" }]}>
                                    <Ionicons name="barbell" size={20} color="#0D7F8D" />
                                </View>
                                <Text style={styles.attachLabel}>Gửi bài tập</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.attachItem}
                                onPress={() => {
                                    setShowAttachMenu(false);
                                    handlePickImage();
                                }}
                            >
                                <View style={[styles.attachIconWrap, { backgroundColor: "#E8F5E9" }]}>
                                    <Ionicons name="nutrition" size={20} color="#2E7D32" />
                                </View>
                                <Text style={styles.attachLabel}>Bữa ăn/Calo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.attachItem}
                                onPress={() => {
                                    setShowAttachMenu(false);
                                    Alert.alert("Tài liệu giáo trình", "Đính kèm file PDF giáo trình tập");
                                }}
                            >
                                <View style={[styles.attachIconWrap, { backgroundColor: "#EDE7F6" }]}>
                                    <Ionicons name="document-text" size={20} color="#5E35B1" />
                                </View>
                                <Text style={styles.attachLabel}>Tài liệu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.attachItem}
                                onPress={() => {
                                    setShowAttachMenu(false);
                                    Alert.alert("Vị trí", "Gửi vị trí phòng tập VisionFit");
                                }}
                            >
                                <View style={[styles.attachIconWrap, { backgroundColor: "#FFF3E0" }]}>
                                    <Ionicons name="location" size={20} color="#E65100" />
                                </View>
                                <Text style={styles.attachLabel}>Vị trí Gym</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.toolbarInputRow}>
                        <TouchableOpacity style={styles.toolIconBtn} onPress={() => setShowAttachMenu(!showAttachMenu)}>
                            <Ionicons name={showAttachMenu ? "close-circle" : "add-circle"} size={26} color="#0D7F8D" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.toolIconBtn} onPress={() => Alert.alert("Camera", "Chụp ảnh bài tập")}>
                            <Ionicons name="camera" size={24} color="#0D7F8D" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.toolIconBtn} onPress={handlePickImage}>
                            <Ionicons name="images" size={23} color="#0D7F8D" />
                        </TouchableOpacity>

                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhắn tin..."
                                placeholderTextColor="#71949A"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity style={styles.emojiBtn} onPress={() => setInputText((prev) => prev + " 😊")}>
                                <Ionicons name="happy-outline" size={22} color="#075E68" />
                            </TouchableOpacity>
                        </View>

                        {/* Nút Like 👍 khi trống, nút Gửi ✈️ khi có chữ */}
                        {inputText.trim().length === 0 ? (
                            <TouchableOpacity style={styles.likeBtn} onPress={() => handleSend("👍")} activeOpacity={0.7}>
                                <Ionicons name="thumbs-up" size={26} color="#0D7F8D" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(inputText)} activeOpacity={0.8}>
                                <Ionicons name="send" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Modal: Thả Reaction */}
            <Modal visible={!!selectedMsgForReaction} transparent={true} animationType="fade" onRequestClose={() => setSelectedMsgForReaction(null)}>
                <TouchableOpacity style={styles.reactionOverlay} activeOpacity={1} onPress={() => setSelectedMsgForReaction(null)}>
                    <View style={styles.reactionCard}>
                        {/* Thanh Emoji */}
                        <View style={styles.emojiBar}>
                            {EMOJI_LIST.map((emoji) => (
                                <TouchableOpacity key={emoji} style={styles.emojiItem} onPress={() => selectedMsgForReaction && handleAddReaction(selectedMsgForReaction.id_tin_nhan, emoji)}>
                                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Menu thao tác */}
                        <View style={styles.msgActionMenu}>
                            <TouchableOpacity
                                style={styles.msgActionRow}
                                onPress={() => {
                                    setReplyingTo(selectedMsgForReaction);
                                    setSelectedMsgForReaction(null);
                                }}
                            >
                                <Ionicons name="arrow-undo-outline" size={20} color="#11343A" />
                                <Text style={styles.msgActionText}>Trả lời tin nhắn</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.msgActionRow}
                                onPress={() => {
                                    Alert.alert("Đã sao chép", "Nội dung tin nhắn đã được lưu.");
                                    setSelectedMsgForReaction(null);
                                }}
                            >
                                <Ionicons name="copy-outline" size={20} color="#11343A" />
                                <Text style={styles.msgActionText}>Sao chép</Text>
                            </TouchableOpacity>

                            {selectedMsgForReaction?.id_nguoi_gui === currentUser.id_nguoi_dung && selectedMsgForReaction?.trang_thai !== "DA_THU_HOI" && (
                                <TouchableOpacity
                                    style={[styles.msgActionRow, { borderTopWidth: 1, borderTopColor: "#DFF6F8" }]}
                                    onPress={() => selectedMsgForReaction && handleRecall(selectedMsgForReaction.id_tin_nhan)}
                                >
                                    <Ionicons name="arrow-undo" size={20} color="#FA3E3E" />
                                    <Text style={[styles.msgActionText, { color: "#FA3E3E" }]}>Thu hồi tin nhắn</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal: Chi tiết đoạn chat (Messenger Info) */}
            <Modal visible={showInfoModal} animationType="slide" transparent={true} onRequestClose={() => setShowInfoModal(false)}>
                <View style={styles.infoModalOverlay}>
                    <View style={styles.infoModalContent}>
                        <View style={styles.infoModalHeader}>
                            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                                <Ionicons name="close" size={26} color="#11343A" />
                            </TouchableOpacity>
                            <Text style={styles.infoModalTitle}>Chi tiết đoạn chat</Text>
                            <View style={{ width: 26 }} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.infoProfile}>
                                <Image source={{ uri: displayAvatar }} style={styles.infoAvatar} />
                                <Text style={styles.infoName}>{displayName}</Text>
                                <Text style={styles.infoSub}>{isGroup ? "Nhóm rèn luyện VisionFit" : partner?.chuyen_mon || "Hội viên"}</Text>
                            </View>

                            <View style={styles.quickActions}>
                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert("Hồ sơ", `Xem hồ sơ của ${displayName}`)}>
                                    <View style={styles.quickActionCircle}>
                                        <Ionicons name="person-outline" size={22} color="#0D7F8D" />
                                    </View>
                                    <Text style={styles.quickActionText}>Trang cá nhân</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert("Thông báo", "Đã đổi trạng thái thông báo")}>
                                    <View style={styles.quickActionCircle}>
                                        <Ionicons name="notifications-outline" size={22} color="#0D7F8D" />
                                    </View>
                                    <Text style={styles.quickActionText}>Tắt thông báo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert("Tìm kiếm", "Tìm kiếm tin nhắn trong chat")}>
                                    <View style={styles.quickActionCircle}>
                                        <Ionicons name="search-outline" size={22} color="#0D7F8D" />
                                    </View>
                                    <Text style={styles.quickActionText}>Tìm kiếm</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert("Chủ đề", "Đổi chủ đề màu sắc")}>
                                    <View style={styles.quickActionCircle}>
                                        <Ionicons name="color-palette-outline" size={22} color="#0D7F8D" />
                                    </View>
                                    <Text style={styles.quickActionText}>Chủ đề</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.infoSection}>
                                <Text style={styles.infoSectionTitle}>TÙY CHỈNH ĐOẠN CHAT</Text>
                                <TouchableOpacity style={styles.infoRow}>
                                    <Ionicons name="pencil-outline" size={20} color="#11343A" />
                                    <Text style={styles.infoRowText}>Đổi tên đoạn chat</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#71949A" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.infoRow}>
                                    <Ionicons name="images-outline" size={20} color="#11343A" />
                                    <Text style={styles.infoRowText}>File phương tiện, file và liên kết</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#71949A" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.infoRow}>
                                    <Ionicons name="fitness-outline" size={20} color="#11343A" />
                                    <Text style={styles.infoRowText}>Lịch sử buổi tập & Phân tích AI</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#71949A" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.infoSection}>
                                <Text style={styles.infoSectionTitle}>QUYỀN RIÊNG TƯ & HỖ TRỢ</Text>
                                <TouchableOpacity style={styles.infoRow}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color="#11343A" />
                                    <Text style={styles.infoRowText}>Xác minh bảo mật đầu cuối</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#71949A" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.infoRow}>
                                    <Ionicons name="warning-outline" size={20} color="#FA3E3E" />
                                    <Text style={[styles.infoRowText, { color: "#FA3E3E" }]}>Báo cáo sự cố / PT</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#71949A" />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal: Xem ảnh phóng to */}
            <Modal visible={!!previewImage} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
                <View style={styles.fullImageOverlay}>
                    <TouchableOpacity style={styles.fullImageCloseBtn} onPress={() => setPreviewImage(null)}>
                        <Ionicons name="close" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                    {previewImage && <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EAF9FB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#9ED9DF",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 3,
    },
    headerBackBtn: {
        padding: 6,
        marginRight: 4,
    },
    headerUserInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    headerAvatarWrap: {
        position: "relative",
        marginRight: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerOnlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#31A24C",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    headerName: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#11343A",
    },
    headerStatus: {
        fontSize: 11,
        color: "#71949A",
    },
    headerPtTag: {
        backgroundColor: "#DFF6F8",
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        marginLeft: 6,
    },
    headerPtTagText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#0D7F8D",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerActionBtn: {
        padding: 7,
        marginLeft: 4,
    },
    messagesList: {
        paddingHorizontal: 14,
        paddingVertical: 16,
    },
    msgRow: {
        flexDirection: "row",
        marginBottom: 14,
        alignItems: "flex-end",
    },
    msgRowSender: {
        justifyContent: "flex-end",
    },
    msgRowReceiver: {
        justifyContent: "flex-start",
    },
    msgAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 16,
    },
    msgBubbleWrap: {
        maxWidth: "76%",
    },
    bubble: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    bubbleSender: {
        backgroundColor: "#0D7F8D",
        borderBottomRightRadius: 4,
    },
    bubbleReceiver: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#9ED9DF",
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontSize: 14.5,
        lineHeight: 20,
    },
    bubbleTextSender: {
        color: "#FFFFFF",
    },
    bubbleTextReceiver: {
        color: "#11343A",
    },
    bubbleRecalled: {
        backgroundColor: "#F0F4F6",
        borderColor: "#CFD8DC",
        borderStyle: "dashed",
        borderWidth: 1,
    },
    recalledText: {
        fontSize: 13,
        fontStyle: "italic",
        color: "#71949A",
    },
    bubbleImage: {
        width: 220,
        height: 160,
        borderRadius: 14,
        marginBottom: 8,
    },
    workoutCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: "#9ED9DF",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 3,
    },
    workoutIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#0D7F8D",
        justifyContent: "center",
        alignItems: "center",
    },
    workoutTag: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0D7F8D",
    },
    workoutTitle: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#11343A",
        marginTop: 2,
    },
    workoutDivider: {
        height: 1,
        backgroundColor: "#DFF6F8",
        marginVertical: 10,
    },
    workoutDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    workoutDetailText: {
        fontSize: 12,
        color: "#11343A",
        marginLeft: 6,
        fontWeight: "500",
    },
    confirmBtn: {
        backgroundColor: "#0D7F8D",
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    confirmedBtn: {
        backgroundColor: "#2E7D32",
    },
    confirmBtnText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    reactionBadge: {
        position: "absolute",
        bottom: -10,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#9ED9DF",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        paddingHorizontal: 4,
    },
    timeText: {
        fontSize: 11,
        color: "#71949A",
    },
    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: 64,
        justifyContent: "space-between",
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#0D7F8D",
    },
    replyBox: {
        flexDirection: "row",
        padding: 8,
        borderRadius: 10,
        marginBottom: 4,
        backgroundColor: "rgba(13, 127, 141, 0.12)",
    },
    replyBoxSender: {
        backgroundColor: "rgba(13, 127, 141, 0.15)",
    },
    replyBoxReceiver: {
        backgroundColor: "rgba(113, 148, 154, 0.15)",
    },
    replyLine: {
        width: 3,
        backgroundColor: "#0D7F8D",
        borderRadius: 2,
        marginRight: 6,
    },
    replyAuthor: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#075E68",
    },
    replyText: {
        fontSize: 12,
        color: "#11343A",
    },
    toolbar: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#9ED9DF",
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 24 : 10,
    },
    replyBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DFF6F8",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    replyBannerTitle: {
        fontSize: 12,
        color: "#075E68",
    },
    replyBannerText: {
        fontSize: 12,
        color: "#11343A",
        marginTop: 2,
    },
    attachMenu: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#DFF6F8",
        marginBottom: 8,
    },
    attachItem: {
        alignItems: "center",
    },
    attachIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    attachLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#11343A",
    },
    toolbarInputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    toolIconBtn: {
        padding: 5,
        marginRight: 2,
    },
    inputBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAF9FB",
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === "ios" ? 8 : 4,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: "#9ED9DF",
    },
    input: {
        flex: 1,
        fontSize: 14.5,
        color: "#11343A",
        maxHeight: 100,
        padding: 0,
    },
    emojiBtn: {
        padding: 4,
        marginLeft: 6,
    },
    likeBtn: {
        padding: 6,
        marginLeft: 2,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#0D7F8D",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 3,
    },
    reactionOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    reactionCard: {
        width: "100%",
        alignItems: "center",
    },
    emojiBar: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#9ED9DF",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 5,
    },
    emojiItem: {
        paddingHorizontal: 8,
    },
    msgActionMenu: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 8,
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 5,
    },
    msgActionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    msgActionText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#11343A",
        marginLeft: 14,
    },
    infoModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "flex-end",
    },
    infoModalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 36,
        maxHeight: "85%",
    },
    infoModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    infoModalTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#11343A",
    },
    infoProfile: {
        alignItems: "center",
        marginVertical: 12,
    },
    infoAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "#0D7F8D",
        marginBottom: 10,
    },
    infoName: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#11343A",
    },
    infoSub: {
        fontSize: 13,
        color: "#71949A",
        marginTop: 4,
        textAlign: "center",
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 18,
    },
    quickActionBtn: {
        alignItems: "center",
        width: 76,
    },
    quickActionCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#DFF6F8",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#11343A",
        textAlign: "center",
    },
    infoSection: {
        marginTop: 16,
    },
    infoSectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#71949A",
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: "#DFF6F8",
    },
    infoRowText: {
        flex: 1,
        fontSize: 14.5,
        fontWeight: "500",
        color: "#11343A",
        marginLeft: 12,
    },
    fullImageOverlay: {
        flex: 1,
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
    },
    fullImageCloseBtn: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullImage: {
        width: "100%",
        height: "80%",
    },
});

export default ChatRoom;
