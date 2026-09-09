import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

const SessionReview = ({ navigation, route }: any) => {
  const session = route?.params?.session || {
    member: "Nguyễn Văn An",
    type: "Strength Training",
    date: "05/09",
    time: "09:00",
    duration: "60 phút",
    status: "Hoàn thành",
    calories: "520 kcal",
  };

  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [comment, setComment] = useState("");

  const difficulties = [
    "Dễ",
    "Vừa",
    "Khó",
    "Rất khó",
  ];

  const handleSave = () => {
    if (rating === 0) {
      Alert.alert(
        "Chưa đánh giá",
        "Vui lòng chọn số sao cho buổi tập."
      );
      return;
    }

    Alert.alert(
      "Đã lưu",
      "Đánh giá buổi tập đã được lưu thành công.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Đánh giá buổi tập
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* MEMBER CARD */}
        <View style={styles.memberCard}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session.member.charAt(0)}
            </Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {session.member}
            </Text>

            <Text style={styles.trainingType}>
              {session.type}
            </Text>

            <Text style={styles.dateTime}>
              {session.date}/2026 • {session.time}
            </Text>
          </View>

          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>
              ✓ Hoàn thành
            </Text>
          </View>

        </View>

        {/* SESSION INFORMATION */}
        <Text style={styles.sectionTitle}>
          THÔNG TIN BUỔI TẬP
        </Text>

        <View style={styles.infoCard}>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text>⏱</Text>
            </View>

            <View>
              <Text style={styles.infoLabel}>
                Thời lượng
              </Text>

              <Text style={styles.infoValue}>
                {session.duration}
              </Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text>🔥</Text>
            </View>

            <View>
              <Text style={styles.infoLabel}>
                Calories
              </Text>

              <Text style={styles.infoValue}>
                {session.calories}
              </Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text>🏋</Text>
            </View>

            <View>
              <Text style={styles.infoLabel}>
                Bài tập
              </Text>

              <Text style={styles.infoValue}>
                8 bài
              </Text>
            </View>
          </View>

        </View>

        {/* RATING */}
        <Text style={styles.sectionTitle}>
          ĐÁNH GIÁ BUỔI TẬP
        </Text>

        <View style={styles.ratingCard}>

          <Text style={styles.ratingQuestion}>
            Bạn đánh giá buổi tập này như thế nào?
          </Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating &&
                      styles.starActive,
                  ]}
                >
                  {star <= rating ? "★" : "☆"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingLabel}>
            {rating === 0
              ? "Chọn mức đánh giá"
              : rating === 1
              ? "Rất không tốt"
              : rating === 2
              ? "Không tốt"
              : rating === 3
              ? "Bình thường"
              : rating === 4
              ? "Tốt"
              : "Xuất sắc"}
          </Text>

        </View>

        {/* DIFFICULTY */}
        <Text style={styles.sectionTitle}>
          MỨC ĐỘ TẬP LUYỆN
        </Text>

        <View style={styles.difficultyContainer}>
          {difficulties.map((item) => {
            const active = difficulty === item;

            return (
              <TouchableOpacity
                key={item}
                onPress={() => setDifficulty(item)}
                style={[
                  styles.difficultyButton,
                  active &&
                    styles.difficultyActive,
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    active &&
                      styles.difficultyTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* COMMENT */}
        <Text style={styles.sectionTitle}>
          NHẬN XÉT
        </Text>

        <View style={styles.commentCard}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Nhập nhận xét về buổi tập..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            style={styles.commentInput}
            maxLength={500}
          />

          <Text style={styles.characterCount}>
            {comment.length}/500
          </Text>
        </View>

        {/* SAVE */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            Lưu đánh giá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>
            Hủy
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  backText: {
    fontSize: 36,
    color: "#111827",
    lineHeight: 40,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  headerSpace: {
    width: 40,
  },

  content: {
    padding: 16,
    paddingBottom: 45,
  },

  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },

  memberName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  trainingType: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
  },

  dateTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },

  completedBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  completedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#059669",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginTop: 23,
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  infoItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  infoLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 3,
    textAlign: "center",
  },

  verticalDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E5E7EB",
  },

  ratingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },

  ratingQuestion: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
  },

  starsContainer: {
    flexDirection: "row",
    marginTop: 15,
  },

  starButton: {
    paddingHorizontal: 5,
  },

  star: {
    fontSize: 39,
    color: "#D1D5DB",
  },

  starActive: {
    color: "#F59E0B",
  },

  ratingLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontWeight: "600",
  },

  difficultyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  difficultyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  difficultyActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  difficultyTextActive: {
    color: "#FFFFFF",
  },

  commentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    minHeight: 140,
  },

  commentInput: {
    flex: 1,
    minHeight: 100,
    fontSize: 13,
    color: "#111827",
  },

  characterCount: {
    textAlign: "right",
    fontSize: 10,
    color: "#9CA3AF",
  },

  saveButton: {
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default SessionReview;