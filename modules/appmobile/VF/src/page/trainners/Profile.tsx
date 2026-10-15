import React from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from "react-native";

const Profile = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >

                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Hồ sơ Trainer
                    </Text>

                    <TouchableOpacity style={styles.moreButton}>
                        <Text style={styles.moreText}>⋮</Text>
                    </TouchableOpacity>
                </View>

                {/* PROFILE */}
                <View style={styles.profileCard}>

                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                N
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.cameraButton}>
                            <Text style={styles.cameraText}>
                                +
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.name}>
                        Nguyễn Trainer
                    </Text>

                    <Text style={styles.role}>
                        Personal Trainer
                    </Text>

                    <View style={styles.ratingRow}>
                        <Text style={styles.rating}>
                            4.8
                        </Text>
                        <Text style={styles.star}>
                            *
                        </Text>

                        <Text style={styles.review}>
                            ||128 đánh giá
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>
                            ✎  Chỉnh sửa hồ sơ
                        </Text>
                    </TouchableOpacity>

                </View>

                {/* PERSONAL INFORMATION */}
                <Text style={styles.sectionTitle}>
                    THÔNG TIN CÁ NHÂN
                </Text>

                <View style={styles.card}>

                    <ProfileItem
                        icon="👤"
                        title="Họ và tên"
                        value="Nguyễn Trainer"
                    />

                    <ProfileItem
                        icon="✉"
                        title="Email"
                        value="trainer@email.com"
                    />

                    <ProfileItem
                        icon="☎"
                        title="Số điện thoại"
                        value="0901 234 567"
                        last
                    />

                </View>

                {/* PROFESSIONAL */}
                <Text style={styles.sectionTitle}>
                    CHUYÊN MÔN
                </Text>

                <View style={styles.card}>

                    <ProfileItem
                        icon="🏋"
                        title="Chuyên môn"
                        value="Strength • Cardio • Yoga"
                    />

                    <ProfileItem
                        icon="📅"
                        title="Kinh nghiệm"
                        value="5 năm"
                        last
                    />

                </View>

                {/* STATISTICS */}
                <Text style={styles.sectionTitle}>
                    THỐNG KÊ
                </Text>

                <View style={styles.statsCard}>

                    <StatItem
                        value="32"
                        label="Buổi tập"
                    />

                    <View style={styles.divider} />

                    <StatItem
                        value="128"
                        label="Hội viên"
                    />

                    <View style={styles.divider} />

                    <StatItem
                        value="4.8"
                        label="Rating"
                    />

                </View>

                {/* SETTINGS */}
                <Text style={styles.sectionTitle}>
                    CÀI ĐẶT
                </Text>

                <View style={styles.card}>

                    <SettingItem
                        icon="🔔"
                        title="Thông báo"
                        onPress={() =>
                            navigation.navigate("NotificationSettings")
                        }
                    />

                    <SettingItem
                        icon="🔒"
                        title="Bảo mật"
                        onPress={() =>
                            navigation.navigate("Security")
                        }
                    />

                    <SettingItem
                        icon="⚙"
                        title="Cài đặt tài khoản"
                        onPress={() =>
                            navigation.navigate("AccountSettings")
                        }
                    />

                    <SettingItem
                        icon="?"
                        title="Trợ giúp"
                        last
                    />

                </View>

                {/* LOGOUT */}
                <TouchableOpacity
                    style={styles.logoutButton}
                >
                    <Text style={styles.logoutText}>
                        Đăng xuất
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

/* PROFILE ITEM */

const ProfileItem = ({
    icon,
    title,
    value,
    last = false,
}: any) => {
    return (
        <View
            style={[
                styles.profileItem,
                !last && styles.itemBorder,
            ]}
        >
            <View style={styles.itemIcon}>
                <Text style={styles.iconText}>
                    {icon}
                </Text>
            </View>

            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>
                    {title}
                </Text>

                <Text style={styles.itemValue}>
                    {value}
                </Text>
            </View>
        </View>
    );
};

/* SETTING ITEM */

const SettingItem = ({
    icon,
    title,
    onPress,
    last = false,
}: any) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.settingItem,
                !last && styles.itemBorder,
            ]}
        >
            <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>
                    {icon}
                </Text>
            </View>

            <Text style={styles.settingTitle}>
                {title}
            </Text>

            <Text style={styles.arrow}>
                ›
            </Text>
        </TouchableOpacity>
    );
};

/* STAT */

const StatItem = ({
    value,
    label,
}: any) => {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statValue}>
                {value}
            </Text>

            <Text style={styles.statLabel}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    content: {
        paddingBottom: 40,
    },

    header: {
        height: 65,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },

    moreButton: {
        width: 40,
        alignItems: "center",
    },

    moreText: {
        fontSize: 28,
        color: "#6B7280",
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        paddingVertical: 28,
        paddingHorizontal: 20,
    },

    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },

    avatar: {
        width: 94,
        height: 94,
        borderRadius: 47,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
    },

    avatarText: {
        fontSize: 38,
        fontWeight: "800",
        
    },

    cameraButton: {
        position: "absolute",
        right: -2,
        bottom: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center",
    },

    cameraText: {
        fontSize: 22,
        color: "#111827",
        lineHeight: 22,
    },

    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
    },

    role: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 4,
    },

    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 9,
    },

    star: {
        fontSize: 16,
        color: "#F59E0B",
    },

    rating: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        marginLeft: 5,
    },

    review: {
        fontSize: 12,
        color: "#9CA3AF",
        marginLeft: 6,
    },

    editButton: {
        marginTop: 17,
        height: 43,
        paddingHorizontal: 22,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        justifyContent: "center",
        alignItems: "center",
    },

    editButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.6,
        marginTop: 22,
        marginBottom: 9,
        paddingHorizontal: 18,
    },

    card: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        borderRadius: 15,
        paddingHorizontal: 16,
    },

    profileItem: {
        minHeight: 70,
        flexDirection: "row",
        alignItems: "center",
    },

    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },

    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    iconText: {
        fontSize: 17,
    },

    itemContent: {
        flex: 1,
    },

    itemTitle: {
        fontSize: 11,
        color: "#9CA3AF",
    },

    itemValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginTop: 4,
    },

    statsCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        borderRadius: 15,
        paddingVertical: 20,
        flexDirection: "row",
        alignItems: "center",
    },

    statItem: {
        flex: 1,
        alignItems: "center",
    },

    statValue: {
        fontSize: 21,
        fontWeight: "800",
        color: "#111827",
    },

    statLabel: {
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 5,
    },

    divider: {
        width: 1,
        height: 35,
        backgroundColor: "#E5E7EB",
    },

    settingItem: {
        height: 62,
        flexDirection: "row",
        alignItems: "center",
    },

    settingIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    settingIconText: {
        fontSize: 16,
    },

    settingTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },

    arrow: {
        fontSize: 25,
        color: "#9CA3AF",
    },

    logoutButton: {
        marginHorizontal: 16,
        marginTop: 25,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FECACA",
        justifyContent: "center",
        alignItems: "center",
    },

    logoutText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#DC2626",
    },
});

export default Profile;
