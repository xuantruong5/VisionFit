import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity, ImageBackground, Alert, ScrollView, useWindowDimensions, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import apiFitlife from "../../../../general/api";

const MyPlansModal = ({ visible, onClose, navigation }: any) => {
    const { width, height } = useWindowDimensions();
    const [programs, setPrograms] = useState<any[]>([]);
    // 1. Lấy danh sách kế hoạch tập 
    useEffect(() => {
        if (visible) {
            apiFitlife.get("/client/all-list-programs")
                .then((res) => {
                    if (res.data.success) {
                        setPrograms(
                            res.data.data.filter(
                                (item: any, index: number, arr: any[]) =>
                                    arr.findIndex((p: any) => p.id === item.id) === index
                            )
                        );
                    } else {
                        setPrograms([]);
                    }
                })
                .catch(() => { });
        }
    }, [visible]);
    const handleActivate = async (item: any) => {
        if (Number(item.tinh_trang) === 1) {
            return;
        }
        try {
            const res = await apiFitlife.post(
                `/client/activate-program/${item.id}`
            );
            if (res.data.success) {
                const listRes = await apiFitlife.get(
                    "/client/all-list-programs"
                );
                if (listRes.data.success) {
                    setPrograms(
                        listRes.data.data.filter(
                            (item: any, index: number, arr: any[]) =>
                                arr.findIndex((p: any) => p.id === item.id) === index
                        )
                    );
                }
                Alert.alert(
                    "Thành công",
                    "Đã chuyển sang chương trình được chọn."
                );
            }
        } catch (error: any) {
            Alert.alert(
                "Lỗi",
                error?.response?.data?.message ||
                "Không thể thay đổi chương trình."
            );
        }
    };

    // 2. Xóa kế hoạch tập 
    const handleDelete = (id: any, name: string) => {
        Alert.alert("Xóa kế hoạch tập", `Bạn có chắc chắn muốn xóa "${name}" không?`, [
            { text: "Hủy", style: "cancel" },
            {
                text: "Xóa",
                style: "destructive",
                onPress: async () => {
                    const res = await apiFitlife.delete(`/client/delete-program/${id}`);
                    if (res.data.success) {
                        setPrograms((prev) => prev.filter((p) => p.id !== id && p.id_chuong_trinh !== id));
                        Alert.alert("Thành công", "Đã xóa kế hoạch tập luyện!");
                    }
                },
            },
        ]);
    };

    if (!visible) return null;

    return (
        <View style={styles.fullscreenOverlay}>
            {/* Backdrop làm mờ ấn ra ngoài để đóng */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={[styles.sheet, { maxHeight: height * 0.88 }]} onStartShouldSetResponder={() => true} >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#11343A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Kế hoạch của tôi</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* 2 nút chọn */}
                    <TouchableOpacity style={styles.btnPrimary}
                        onPress={() => {
                            onClose();
                            navigation?.navigate("WorkoutPlanScreen");
                        }}>
                        <Text style={styles.btnPrimaryText}>THÊM KẾ HOẠCH TẬP MẶC ĐỊNH</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnSecondary}
                        onPress={() => {
                            onClose();
                            navigation?.navigate("WorkoutPlanScreen");
                        }} >
                        <Text style={styles.btnSecondaryText}>SỬ DỤNG ỨNG DỤNG TẬP LUYỆN</Text>
                    </TouchableOpacity>

                    {/* Danh sách thẻ kế hoạch */}
                    {programs.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="barbell-outline" size={44} color="#94B2B7" />
                            <Text style={styles.emptyText}>Chưa có kế hoạch tập luyện nào</Text>
                        </View>
                    ) : (
                        programs.map((item) => (
                            <ScrollView key={item.id || item.id_chuong_trinh} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow} nestedScrollEnabled={true} overScrollMode="never" >
                                <TouchableOpacity activeOpacity={0.9} onPress={() => handleActivate(item)}>
                                    <ImageBackground
                                        source={
                                            item.anh_dai_dien
                                                ? { uri: item.anh_dai_dien }
                                                : require("../../../../assets/anh-fi.jpg")
                                        }
                                        style={[styles.card, { width: width - 40 }]}
                                        imageStyle={{ borderRadius: 14 }} >
                                        <View style={styles.cardOverlay} />
                                        <View style={[styles.badge, { backgroundColor: Number(item.tinh_trang) === 1 ? "#00A878" : "#FF5E74", },]}>
                                            <Text style={styles.badgeText}>
                                                {Number(item.tinh_trang) === 1 ? "ĐANG HOẠT ĐỘNG" : "TẠM DỪNG HOẠT ĐỘNG"}
                                            </Text>
                                        </View>
                                        <Text style={styles.cardTitle} numberOfLines={1}>
                                            {item.ten_chuong_trinh || "Tăng cơ bắp nói chung"}
                                        </Text>
                                        <View style={styles.metaRow}>
                                            <Ionicons name="barbell-outline" size={14} color="#FFF" />
                                            <Text style={styles.metaText}>{item.ten_noi_tap || "Tại gym"}</Text>
                                            <View style={styles.stars}>
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Ionicons key={s} name={s <= (item.so_sao || 1) ? "star" : "star-outline"} size={13} color="#FFF" />
                                                ))}
                                            </View>
                                            <Text style={styles.metaText}>{item.ten_cap_do || "Người bắt đầu"}</Text>
                                        </View>
                                        <Text style={styles.duration}>
                                            {item.so_ngay || 24} ngày tập luyện ({item.so_buoi_moi_tuan || 3} buổi mỗi tuần)
                                        </Text>
                                        <Text style={styles.completed}>Tập luyện hoàn tất: 0</Text>

                                        <TouchableOpacity style={styles.trashBtnCard} onPress={() => handleDelete(item.id || item.id_chuong_trinh, item.ten_chuong_trinh)} activeOpacity={0.8} >
                                            <Ionicons name="trash-outline" size={18} color="#FFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.shareBtn} onPress={() => Alert.alert("Chia sẻ", "Chia sẻ kế hoạch tập")}>
                                            <Ionicons name="share-social" size={18} color="#FFF" />
                                        </TouchableOpacity>
                                    </ImageBackground>

                                    {/* Nút xóa đỏ khi vuốt sang */}
                                    {/* <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id || item.id_chuong_trinh, item.ten_chuong_trinh)}>
                                        <Ionicons name="trash-outline" size={24} color="#FFF" />
                                    </TouchableOpacity> */}
                                </TouchableOpacity>



                            </ScrollView>
                        )))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullscreenOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sheet: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F4F5",
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5EBEF",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#11343A",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 120,
    },
    btnPrimary: {
        height: 52,
        backgroundColor: "#00BBC0",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    btnPrimaryText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    btnSecondary: {
        height: 52,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#355C7D",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    btnSecondaryText: {
        color: "#355C7D",
        fontSize: 15,
        fontWeight: "700",
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    card: {
        minHeight: 146,
        paddingHorizontal: 16,
        paddingVertical: 16,
        justifyContent: "center",
    },
    cardOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(10, 32, 44, 0.72)",
        borderRadius: 14,
    },
    badge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#FF5E74",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderTopRightRadius: 14,
        borderBottomLeftRadius: 10,
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    metaText: {
        color: "#E2EDF0",
        fontSize: 12,
        marginLeft: 4,
    },
    stars: {
        flexDirection: "row",
        marginHorizontal: 8,
    },
    duration: {
        color: "#18C5C9",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 5,
    },
    completed: {
        color: "#FFFFFF",
        fontSize: 12,
    },
    trashBtnCard: {
        position: "absolute",
        right: 58,
        bottom: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FF3B4E",
        alignItems: "center",
        justifyContent: "center",
    },
    shareBtn: {
        position: "absolute",
        right: 14,
        bottom: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#00BBC0",
        alignItems: "center",
        justifyContent: "center",
    },
    deleteBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#FF3B4E",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 14,
        marginRight: 16,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 45,
    },
    emptyText: {
        marginTop: 12,
        color: "#71949A",
        fontSize: 15,
        fontWeight: "500",
    },
});

export default MyPlansModal;
