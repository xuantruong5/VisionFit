import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    TextInput,
    Image,
    ScrollView,
    Modal,
    Alert,
    StatusBar,
    ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import apiFitlife, { BASE_URL } from "../../general/api";

// Dữ liệu người dùng hiện tại (Hội viên VisionFit)
const CURRENT_USER = {
    id_nguoi_dung: 1,
    ho_ten: "Lê Hoàng Nam",
    anh_dai_dien: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    vai_tro: "HOI_VIEN",
    online: true,
};

const getImageUrl = (url: string | null) => {
    if (!url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url}`;
};

const ChatList = ({ navigation }: any) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("ALL");
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRooms();
        fetchContacts();

        const unsubscribe = navigation.addListener?.("focus", () => {
            fetchRooms();
        });
        return unsubscribe;
    }, []);

    // Tải danh sách phòng chat từ Backend
    const fetchRooms = async () => {
        try {
            setIsLoading(true);
            const response = await apiFitlife.get("/chat/rooms");
            if (response.data && response.data.status) {
                setConversations(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Tải danh bạ HLV và Hội viên từ Backend
    const fetchContacts = async () => {
        try {
            const response = await apiFitlife.get("/chat/contacts");
            if (response.data && response.data.status && response.data.data) {
                const allList = response.data.data.all || [
                    ...(response.data.data.trainers || []),
                    ...(response.data.data.members || []),
                ];
                setContacts(allList);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchRooms();
        fetchContacts();
    };

    // Danh sách Story / Đang hoạt động tạo động từ danh bạ Backend
    const activeStories = useMemo(() => {
        const list: any[] = [
            {
                id: 'self',
                isSelf: true,
                ho_ten: "Ghi chú",
                anh_dai_dien: CURRENT_USER.anh_dai_dien,
                note: "Ghi chú: Tập luyện 💪",
            }
        ];
        contacts.slice(0, 10).forEach((c: any, index: number) => {
            list.push({
                id: `${c.vai_tro || 'contact'}_${c.id_nguoi_dung}_${index}`,
                isSelf: false,
                ho_ten: c.ho_ten,
                anh_dai_dien: getImageUrl(c.anh_dai_dien),
                note: c.vai_tro === "HUAN_LUYEN_VIEN" ? (c.chuyen_mon || "HLV") : "Đang hoạt động",
                contact: c,
            });
        });
        return list;
    }, [contacts]);

    // Tính tổng số tin nhắn chưa đọc
    const totalUnread = useMemo(() => {
        return conversations.reduce((acc, curr) => acc + (curr.so_tin_chua_doc || 0), 0);
    }, [conversations]);

    // Lọc danh sách hội thoại
    const filteredConversations = useMemo(() => {
        return conversations.filter((item: any) => {
            const name = item.loai === "NHOM" ? item.ten_nhom : item.doi_phuong?.ho_ten;
            const matchQuery = (name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.noi_dung_cuoi || "").toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchQuery) return false;

            if (selectedFilter === "PT") return item.doi_phuong?.vai_tro === "HUAN_LUYEN_VIEN";
            if (selectedFilter === "GROUP") return item.loai === "NHOM";
            if (selectedFilter === "UNREAD") return (item.so_tin_chua_doc || 0) > 0;

            return true;
        });
    }, [conversations, searchQuery, selectedFilter]);

    // Mở phòng chat
    const handleOpenChat = (item: any) => {
        setConversations(prev =>
            prev.map(c => c.id_cuoc_tro_chuyen === item.id_cuoc_tro_chuyen ? { ...c, so_tin_chua_doc: 0, da_xem: true } : c)
        );
        navigation.navigate("ChatRoom", { conversation: item, currentUser: CURRENT_USER });
    };

    // Bắt đầu chat với một người trong danh bạ
    const handleStartChat = async (contact: any) => {
        setShowNewChatModal(false);

        try {
            const response = await apiFitlife.get(`/chat/room/${contact.id_nguoi_dung}`);
            if (response.data && response.data.status && response.data.data) {
                const room = response.data.data;
                const newConv = {
                    id_cuoc_tro_chuyen: room.id,
                    room_uuid: room.uuid,
                    loai: room.type === 2 ? "NHOM" : "TRUC_TIEP",
                    doi_phuong: contact,
                    thoi_gian_tin_nhan_cuoi: "Vừa xong",
                    noi_dung_cuoi: "Đã bắt đầu cuộc trò chuyện mới",
                    so_tin_chua_doc: 0,
                    ghim: false,
                    da_tat_thong_bao: false,
                    da_xem: true,
                };
                setConversations(prev => {
                    const exists = prev.find(c => c.id_cuoc_tro_chuyen === room.id || c.room_uuid === room.uuid);
                    if (exists) return prev;
                    return [newConv, ...prev];
                });
                handleOpenChat(newConv);
            }
        } catch (error) {
            console.error("Error starting chat:", error);
            Alert.alert("Lỗi", "Không thể kết nối đến server để tạo phòng chat.");
        }
    };

    // Ghim cuộc trò chuyện
    const handleTogglePin = async (conv: any) => {
        if (!conv) return;
        const targetId = conv.room_uuid || conv.id_cuoc_tro_chuyen;
        try {
            await apiFitlife.post(`/chat/room/${targetId}/pin`);
        } catch (e) {
            console.log("Lỗi khi ghim đoạn chat:", e);
        }
        setConversations(prev => prev.map(c => c.id_cuoc_tro_chuyen === conv.id_cuoc_tro_chuyen ? { ...c, ghim: !c.ghim } : c));
        setSelectedConv(null);
    };

    // Tắt/bật thông báo
    const handleToggleMute = async (conv: any) => {
        if (!conv) return;
        const targetId = conv.room_uuid || conv.id_cuoc_tro_chuyen;
        try {
            await apiFitlife.post(`/chat/room/${targetId}/mute`);
        } catch (e) {
            console.log("Lỗi khi đổi thông báo:", e);
        }
        setConversations(prev => prev.map(c => c.id_cuoc_tro_chuyen === conv.id_cuoc_tro_chuyen ? { ...c, da_tat_thong_bao: !c.da_tat_thong_bao } : c));
        setSelectedConv(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />



            {/* Thanh tìm kiếm */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#71949A" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm HLV, bạn tập, tin nhắn..."
                    placeholderTextColor="#71949A"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={18} color="#71949A" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Danh sách chính */}
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#0D7F8D" />
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    keyExtractor={(item, index) => (item.room_uuid || item.id_cuoc_tro_chuyen ? `${item.room_uuid || item.id_cuoc_tro_chuyen}` : `conv_${index}`)}
                    showsVerticalScrollIndicator={false}
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    contentContainerStyle={styles.listContainer}
                    ListHeaderComponent={
                        <>
                            {/* Thanh Story Notes "Đang hoạt động" */}
                            {searchQuery.trim() === "" && (
                                <View style={styles.storiesContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                                        {activeStories.map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.storyCard}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    if (item.isSelf) {
                                                        Alert.alert("Ghi chú của bạn", "Chia sẻ cảm nghĩ hoặc trạng thái tập luyện hôm nay");
                                                    } else if (item.contact) {
                                                        handleStartChat(item.contact);
                                                    }
                                                }}
                                            >
                                                <View style={styles.noteBubble}>
                                                    <Text style={styles.noteBubbleText} numberOfLines={1}>
                                                        {item.note}
                                                    </Text>
                                                </View>
                                                <View style={[styles.storyAvatarWrap, item.isSelf ? styles.selfStoryRing : styles.onlineStoryRing]}>
                                                    <Image source={{ uri: item.anh_dai_dien }} style={styles.storyAvatar} />
                                                    {item.isSelf ? (
                                                        <View style={styles.plusBadge}>
                                                            <Ionicons name="add" size={12} color="#FFFFFF" />
                                                        </View>
                                                    ) : (
                                                        <View style={styles.onlineDotStory} />
                                                    )}
                                                </View>
                                                <Text style={styles.storyNameText} numberOfLines={1}>
                                                    {item.ho_ten}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Bộ lọc theo Tabs */}
                            <View style={styles.filterTabs}>
                                <TouchableOpacity
                                    style={[styles.filterTabBtn, selectedFilter === "ALL" && styles.filterTabBtnActive]}
                                    onPress={() => setSelectedFilter("ALL")}
                                >
                                    <Text style={[styles.filterTabText, selectedFilter === "ALL" && styles.filterTabTextActive]}>Tất cả</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filterTabBtn, selectedFilter === "PT" && styles.filterTabBtnActive]}
                                    onPress={() => setSelectedFilter("PT")}
                                >
                                    <Ionicons name="fitness-outline" size={14} color={selectedFilter === "PT" ? "#FFFFFF" : "#0D7F8D"} style={{ marginRight: 4 }} />
                                    <Text style={[styles.filterTabText, selectedFilter === "PT" && styles.filterTabTextActive]}>HLV / PT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filterTabBtn, selectedFilter === "GROUP" && styles.filterTabBtnActive]}
                                    onPress={() => setSelectedFilter("GROUP")}
                                >
                                    <Ionicons name="people-outline" size={14} color={selectedFilter === "GROUP" ? "#FFFFFF" : "#0D7F8D"} style={{ marginRight: 4 }} />
                                    <Text style={[styles.filterTabText, selectedFilter === "GROUP" && styles.filterTabTextActive]}>Nhóm tập</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.filterTabBtn, selectedFilter === "UNREAD" && styles.filterTabBtnActive]}
                                    onPress={() => setSelectedFilter("UNREAD")}
                                >
                                    <Text style={[styles.filterTabText, selectedFilter === "UNREAD" && styles.filterTabTextActive]}>Chưa đọc</Text>
                                    {totalUnread > 0 && (
                                        <View style={styles.filterBadge}>
                                            <Text style={styles.filterBadgeText}>{totalUnread}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    }
                    renderItem={({ item }) => {
                        const isGroup = item.loai === "NHOM";
                        const isUnread = item.so_tin_chua_doc > 0;
                        const isCoach = !isGroup && item.doi_phuong?.vai_tro === "HUAN_LUYEN_VIEN";
                        const name = isGroup ? item.ten_nhom : item.doi_phuong?.ho_ten;
                        const avatar = isGroup ? getImageUrl(item.anh_nhom) : getImageUrl(item.doi_phuong?.anh_dai_dien);

                        return (
                            <TouchableOpacity
                                style={[styles.chatCard, isUnread && styles.chatCardUnread]}
                                activeOpacity={0.7}
                                onPress={() => handleOpenChat(item)}
                                onLongPress={() => setSelectedConv(item)}
                            >
                                {/* Avatar */}
                                <View style={styles.chatAvatarWrap}>
                                    <Image source={{ uri: avatar }} style={styles.chatAvatar} />
                                    {!isGroup && item.doi_phuong?.online && <View style={styles.chatOnlineDot} />}
                                    {isGroup && (
                                        <View style={styles.chatGroupBadge}>
                                            <Ionicons name="people" size={10} color="#FFFFFF" />
                                        </View>
                                    )}
                                </View>

                                {/* Thông tin cuộc hội thoại */}
                                <View style={styles.chatInfo}>
                                    <View style={styles.chatInfoTop}>
                                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                                            <Text style={[styles.chatName, isUnread && styles.chatNameUnread]} numberOfLines={1}>
                                                {name}
                                            </Text>
                                            {isCoach && (
                                                <View style={styles.ptBadge}>
                                                    <Text style={styles.ptBadgeText}>PT</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.chatTime, isUnread && styles.chatTimeUnread]}>
                                            {item.thoi_gian_tin_nhan_cuoi}
                                        </Text>
                                    </View>

                                    <View style={styles.chatInfoBottom}>
                                        <Text style={[styles.chatSnippet, isUnread && styles.chatSnippetUnread]} numberOfLines={1}>
                                            {item.noi_dung_cuoi}
                                        </Text>
                                        <View style={styles.chatStatusIcons}>
                                            {item.da_tat_thong_bao && (
                                                <Ionicons name="notifications-off" size={14} color="#71949A" style={{ marginRight: 5 }} />
                                            )}
                                            {item.ghim && (
                                                <MaterialCommunityIcons name="pin" size={14} color="#0D7F8D" style={{ marginRight: 5 }} />
                                            )}
                                            {isUnread ? (
                                                <View style={styles.unreadCounter}>
                                                    <Text style={styles.unreadCounterText}>{item.so_tin_chua_doc}</Text>
                                                </View>
                                            ) : (
                                                item.da_xem && <Ionicons name="checkmark-done" size={16} color="#0D7F8D" />
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="chatbubbles-outline" size={38} color="#0D7F8D" />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
                            <Text style={styles.emptyText}>Nhấn vào nút bên dưới để bắt đầu cuộc trò chuyện mới!</Text>
                        </View>
                    }
                />
            )}

            {/* Nút FAB Soạn tin nhắn mới */}
            <TouchableOpacity
                style={styles.fabButton}
                activeOpacity={0.85}
                onPress={() => setShowNewChatModal(true)}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Modal: Tạo cuộc trò chuyện mới */}
            <Modal visible={showNewChatModal} animationType="slide" transparent={true} onRequestClose={() => setShowNewChatModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Đoạn chat mới</Text>
                            <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
                                <Ionicons name="close" size={24} color="#11343A" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.modalGroupAction}
                            onPress={() => {
                                setShowNewChatModal(false);
                                Alert.alert("Tạo nhóm mới", "Tính năng tạo phòng chat nhóm thể hình VisionFit");
                            }}
                        >
                            <View style={styles.modalGroupIcon}>
                                <Ionicons name="people" size={22} color="#0D7F8D" />
                            </View>
                            <View>
                                <Text style={styles.modalGroupTitle}>Tạo nhóm tập mới</Text>
                                <Text style={styles.modalGroupSub}>Tạo phòng chat cho nhóm PT, bạn cùng phòng</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.modalSectionTitle}>GỢI Ý HUẤN LUYỆN VIÊN & HỘI VIÊN</Text>

                        <FlatList
                            data={contacts}
                            keyExtractor={(item, index) => `${item.vai_tro || 'contact'}_${item.id_nguoi_dung}_${index}`}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.contactRow} onPress={() => handleStartChat(item)}>
                                    <View style={styles.contactAvatarWrap}>
                                        <Image source={{ uri: getImageUrl(item.anh_dai_dien) }} style={styles.contactAvatar} />
                                        {item.online && <View style={styles.contactOnlineDot} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <Text style={styles.contactName}>{item.ho_ten}</Text>
                                            {item.vai_tro === "HUAN_LUYEN_VIEN" && (
                                                <View style={styles.ptBadgeSmall}>
                                                    <Text style={styles.ptBadgeSmallText}>HLV</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.contactSub}>{item.chuyen_mon}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal: Tùy chọn khi nhấn giữ (Action Sheet) */}
            <Modal visible={!!selectedConv} animationType="fade" transparent={true} onRequestClose={() => setSelectedConv(null)}>
                <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setSelectedConv(null)}>
                    <View style={styles.sheetCard}>
                        <Text style={styles.sheetTitle}>
                            {selectedConv?.loai === "NHOM" ? selectedConv?.ten_nhom : selectedConv?.doi_phuong?.ho_ten}
                        </Text>
                        <TouchableOpacity
                            style={styles.sheetRow}
                            onPress={() => handleTogglePin(selectedConv)}
                        >
                            <MaterialCommunityIcons name={selectedConv?.ghim ? "pin-off-outline" : "pin-outline"} size={22} color="#0D7F8D" />
                            <Text style={styles.sheetRowText}>{selectedConv?.ghim ? "Bỏ ghim" : "Ghim lên đầu"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sheetRow}
                            onPress={() => handleToggleMute(selectedConv)}
                        >
                            <Ionicons name={selectedConv?.da_tat_thong_bao ? "notifications-outline" : "notifications-off-outline"} size={22} color="#0D7F8D" />
                            <Text style={styles.sheetRowText}>{selectedConv?.da_tat_thong_bao ? "Bật thông báo" : "Tắt thông báo"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.sheetRow, { borderTopWidth: 1, borderTopColor: "#DFF6F8" }]}
                            onPress={() => {
                                Alert.alert("Xóa đoạn chat", "Bạn có chắc chắn muốn xóa cuộc trò chuyện này?", [
                                    { text: "Hủy", style: "cancel" },
                                    {
                                        text: "Xóa",
                                        style: "destructive",
                                        onPress: () => {
                                            setConversations(prev => prev.filter(c => c.id_cuoc_tro_chuyen !== selectedConv?.id_cuoc_tro_chuyen));
                                            setSelectedConv(null);
                                        },
                                    },
                                ]);
                            }}
                        >
                            <Ionicons name="trash-outline" size={22} color="#FA3E3E" />
                            <Text style={[styles.sheetRowText, { color: "#FA3E3E" }]}>Xóa đoạn chat</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarWrap: {
        position: "relative",
        marginRight: 12,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 2,
        borderColor: "#0D7F8D",
    },
    onlineBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: "#31A24C",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    titleWrap: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#11343A",
    },
    badgeUnreadTotal: {
        backgroundColor: "#0D7F8D",
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    badgeUnreadTotalText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#9ED9DF",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 3,
    },
    headerBtnActive: {
        backgroundColor: "#0D7F8D",
        borderColor: "#0D7F8D",
    },
    searchBox: {
        marginTop: 100,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginVertical: 8,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#9ED9DF",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#11343A",
        padding: 0,
    },
    listContainer: {
        paddingBottom: 80,
    },
    storiesContainer: {
        paddingVertical: 8,
    },
    storiesScroll: {
        paddingHorizontal: 16,
    },
    storyCard: {
        alignItems: "center",
        marginRight: 14,
        width: 72,
    },
    noteBubble: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: "#9ED9DF",
        maxWidth: 76,
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    noteBubbleText: {
        fontSize: 10,
        color: "#075E68",
        fontWeight: "bold",
        textAlign: "center",
    },
    storyAvatarWrap: {
        position: "relative",
        padding: 2,
        borderRadius: 30,
        borderWidth: 2,
    },
    selfStoryRing: {
        borderColor: "#9ED9DF",
        borderStyle: "dashed",
    },
    onlineStoryRing: {
        borderColor: "#0D7F8D",
    },
    storyAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    plusBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#0D7F8D",
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    onlineDotStory: {
        position: "absolute",
        bottom: 2,
        right: 2,
        backgroundColor: "#31A24C",
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    storyNameText: {
        fontSize: 11,
        color: "#11343A",
        marginTop: 4,
        fontWeight: "500",
        textAlign: "center",
    },
    filterTabs: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginVertical: 10,
    },
    filterTabBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#9ED9DF",
        marginRight: 8,
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    filterTabBtnActive: {
        backgroundColor: "#0D7F8D",
        borderColor: "#0D7F8D",
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#71949A",
    },
    filterTabTextActive: {
        color: "#FFFFFF",
    },
    filterBadge: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginLeft: 6,
    },
    filterBadgeText: {
        color: "#0D7F8D",
        fontSize: 10,
        fontWeight: "bold",
    },
    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "transparent",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 4,
    },
    chatCardUnread: {
        borderColor: "#9ED9DF",
        backgroundColor: "#FFFFFF",
    },
    chatAvatarWrap: {
        position: "relative",
        marginRight: 14,
    },
    chatAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    chatOnlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: "#31A24C",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    chatGroupBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#0D7F8D",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    chatInfo: {
        flex: 1,
        justifyContent: "center",
    },
    chatInfoTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    chatName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#11343A",
    },
    chatNameUnread: {
        fontWeight: "bold",
        color: "#075E68",
    },
    ptBadge: {
        backgroundColor: "#DFF6F8",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 6,
        borderWidth: 0.5,
        borderColor: "#9ED9DF",
    },
    ptBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0D7F8D",
    },
    chatTime: {
        fontSize: 12,
        color: "#71949A",
    },
    chatTimeUnread: {
        color: "#0D7F8D",
        fontWeight: "bold",
    },
    chatInfoBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    chatSnippet: {
        flex: 1,
        fontSize: 13,
        color: "#71949A",
        marginRight: 8,
    },
    chatSnippetUnread: {
        color: "#11343A",
        fontWeight: "bold",
    },
    chatStatusIcons: {
        flexDirection: "row",
        alignItems: "center",
    },
    unreadCounter: {
        backgroundColor: "#0D7F8D",
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 5,
    },
    unreadCounterText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "bold",
    },
    emptyWrap: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#DFF6F8",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#11343A",
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 13,
        color: "#71949A",
        textAlign: "center",
    },
    fabButton: {
        position: "absolute",
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#0D7F8D",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#D9D7FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 36,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#11343A",
    },
    modalGroupAction: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#DFF6F8",
        marginBottom: 12,
    },
    modalGroupIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#DFF6F8",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    modalGroupTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#11343A",
    },
    modalGroupSub: {
        fontSize: 12,
        color: "#71949A",
    },
    modalSectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#71949A",
        letterSpacing: 0.8,
        marginVertical: 10,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    contactAvatarWrap: {
        position: "relative",
        marginRight: 12,
    },
    contactAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    contactOnlineDot: {
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
    contactName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#11343A",
    },
    ptBadgeSmall: {
        backgroundColor: "#DFF6F8",
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        marginLeft: 6,
    },
    ptBadgeSmallText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#0D7F8D",
    },
    contactSub: {
        fontSize: 12,
        color: "#71949A",
        marginTop: 2,
    },
    sheetOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "flex-end",
    },
    sheetCard: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#11343A",
        textAlign: "center",
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#DFF6F8",
        marginBottom: 8,
    },
    sheetRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    sheetRowText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#11343A",
        marginLeft: 14,
    },
});

export default ChatList;