import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity, Image, Alert, ScrollView, useWindowDimensions, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import apiFitlife from "../../../../general/api";
import LinearGradient from "react-native-linear-gradient";
import { COLORS, SHADOWS } from "../../../../general/theme";

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
        Alert.alert(
            "Xóa kế hoạch tập",
            `Bạn có chắc chắn muốn xóa "${name}" không?`,
            [
                {
                    text: "Hủy",
                    style: "cancel",
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await apiFitlife.delete( `/client/delete-program/${id}` );
                            if (res.data.success) {
                                // Lấy lại danh sách sau khi xóa
                                const listRes = await apiFitlife.get(
                                    "/client/all-list-programs"
                                );
                                const danhSach = listRes.data.success
                                    ? listRes.data.data.filter(
                                        (item: any, index: number, arr: any[]) =>
                                            arr.findIndex(
                                                (p: any) =>
                                                    String(p.id) === String(item.id)
                                            ) === index
                                    )
                                    : [];
                                // Cập nhật danh sách kế hoạch
                                setPrograms(danhSach);
                                Alert.alert( "Thành công", "Đã xóa kế hoạch tập luyện!");

                                // Nếu không còn chương trình nào
                                if (danhSach.length === 0) {
                                    onClose();
                                    navigation.navigate("WorkoutPlanScreen");
                                }
                            } else {
                                Alert.alert(
                                    "Lỗi",
                                    res.data.message || "Không thể xóa kế hoạch."
                                );
                            }
                        } catch (error: any) {
                            Alert.alert(
                                "Lỗi",
                                error?.response?.data?.message ||
                                "Không thể xóa kế hoạch tập luyện."
                            );
                        }
                    },
                },
            ]
        );
    };


    if (!visible) return null;

    return (
        <View style={styles.fullscreenOverlay}>
            {/* Backdrop làm mờ ấn ra ngoài để đóng */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={[styles.sheet, { maxHeight: height * 0.88 }]} onStartShouldSetResponder={() => true} >
                <View style={styles.grabber} />
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Kế hoạch của tôi</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* 2 nút chọn */}
                    <TouchableOpacity style={styles.btnPrimary}
                        onPress={() => {
                            onClose();
                            navigation?.navigate("WorkoutPlanScreen");
                        }}>
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient}>
                            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                            <Text style={styles.btnPrimaryText}>THÊM KẾ HOẠCH TẬP MẶC ĐỊNH</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnSecondary}
                        onPress={() => {
                            onClose();
                            navigation?.navigate("WorkoutPlanScreen");
                        }} >
                        <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.btnSecondaryText}>SỬ DỤNG ỨNG DỤNG TẬP LUYỆN</Text>
                    </TouchableOpacity>

                    {/* Danh sách thẻ kế hoạch */}
                    {programs.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="barbell-outline" size={34} color={COLORS.primary} />
                            </View>
                            <Text style={styles.emptyText}>Chưa có kế hoạch tập luyện nào</Text>
                        </View>
                    ) : (
                        programs.map((item) => (
                            <ScrollView key={item.id || item.id_chuong_trinh} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow} nestedScrollEnabled={true} overScrollMode="never" >
                                <TouchableOpacity activeOpacity={0.9} onPress={() => handleActivate(item)}>
                                    <View style={[styles.card, { width: width - 32 }]}>
                                        <Image
                                            source={
                                                item.anh_dai_dien
                                                    ? { uri: item.anh_dai_dien }
                                                    : require("../../../../assets/anh-fi.jpg")
                                            }
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                        <LinearGradient
                                            colors={["rgba(7,88,101,0.78)", "rgba(10,32,44,0.9)"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.cardOverlay}
                                        />
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
                                    </View>

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
        backgroundColor: "rgba(7, 30, 35, 0.55)",
    },
    sheet: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 10,
        overflow: "hidden",
    },
    grabber: {
        alignSelf: "center",
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.border,
        marginBottom: 10,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerSpacer: {
        width: 40,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    btnPrimary: {
        height: 52,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 10,
        ...SHADOWS.glow,
    },
    btnGradient: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    btnPrimaryText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    btnSecondary: {
        height: 52,
        flexDirection: "row",
        gap: 8,
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    btnSecondaryText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    card: {
        minHeight: 150,
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 16,
        justifyContent: "center",
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: COLORS.primaryDark,
    },
    cardImage: {
        ...StyleSheet.absoluteFill,
        width: "100%",
        height: "100%",
    },
    cardOverlay: {
        ...StyleSheet.absoluteFill,
    },
    badge: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "#FF5E74",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10.5,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    cardTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 8,
    },
    metaText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    stars: {
        flexDirection: "row",
        marginHorizontal: 8,
    },
    duration: {
        color: "#5EEAD4",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 4,
    },
    completed: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 12,
    },
    trashBtnCard: {
        position: "absolute",
        right: 62,
        bottom: 14,
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: "rgba(239,68,68,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    shareBtn: {
        position: "absolute",
        right: 14,
        bottom: 14,
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
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
        paddingVertical: 36,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: "800",
    },
});

export default MyPlansModal;
