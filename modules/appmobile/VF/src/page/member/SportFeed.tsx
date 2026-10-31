import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Image,
    StatusBar,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import api, { BASE_URL } from '../../general/api';
import { COLORS, SHADOWS } from '../../general/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { launchImageLibrary, Asset, } from 'react-native-image-picker';

const resolveMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    const storageIdx = url.indexOf('/storage/');
    if (storageIdx !== -1) {
        return `${BASE_URL}${url.substring(storageIdx)}`;
    }
    if (url.startsWith('/')) {
        return `${BASE_URL}${url}`;
    }
    return url;
};

type Media = {
    id_media: number;
    id_bai_dang: number;
    loai_media: 'image' | 'video';
    media_url: string;
    thu_tu: number;
};

type BaiDang = {
    id_bai_dang: number;
    id_nguoi_dung: number;
    caption: string;
    pham_vi_hien_thi: string;
    tinh_trang: string;
    ten_nguoi_dung: string;
    avatar: string;
    anh_dai_dien: string | null;
    created_at: string;
    media: Media[];

    so_luot_thich: number;
    so_binh_luan: number;
    da_thich: boolean;
    da_luu: boolean;
};

type BinhLuan = {
    id_binh_luan: number;
    id_bai_dang: number;
    id_nguoi_dung: number;

    id_binh_luan_cha: number | null;

    noi_dung: string;
    ten_nguoi_dung: string;
    anh_dai_dien: string | null;

    so_luot_thich: number;
    da_thich: boolean;

    created_at: string;
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'Vừa xong';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    }

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        const hour = date
            .getHours()
            .toString()
            .padStart(2, '0');

        const minute = date
            .getMinutes()
            .toString()
            .padStart(2, '0');

        return `Hôm nay ${hour}:${minute}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        const hour = date
            .getHours()
            .toString()
            .padStart(2, '0');

        const minute = date
            .getMinutes()
            .toString()
            .padStart(2, '0');

        return `Hôm qua ${hour}:${minute}`;
    }

    return date.toLocaleDateString('vi-VN');
};

const SportFeed = () => {
    const isFocused = useIsFocused();
    const [showFilter, setShowFilter] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [createTitle, setCreateTitle] = useState('Tạo bài đăng');

    const [caption, setCaption] = useState('');
    const [phamViHienThi, setPhamViHienThi] = useState('0');
    const [selectedExercise, setSelectedExercise] = useState('Squat');
    const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);

    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [showAchievementPicker, setShowAchievementPicker] = useState(false);
    const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);

    const [selectedMedia, setSelectedMedia] = useState<Asset | null>(null);
    const [baiDang, setBaiDang] = useState<BaiDang[]>([]);

    const [comments, setComments] = useState<BinhLuan[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BaiDang | null>(null);
    const [commentText, setCommentText] = useState('');
    const [showCommentMenu, setShowCommentMenu] = useState<number | null>(null);
    const [editingComment, setEditingComment] = useState<BinhLuan | null>(null);
    const [replyingTo, setReplyingTo] = useState<BinhLuan | null>(null);

    const [showSavedPosts, setShowSavedPosts] = useState(false);
    const [savedPostsData, setSavedPostsData] = useState<BaiDang[]>([]);
    const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);

    const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
    const [editingPost, setEditingPost] = useState<BaiDang | null>(null);
    const [editCaption, setEditCaption] = useState('');

    const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);

    const chonMedia = async () => {
        const result = await launchImageLibrary({
            mediaType: 'mixed',
            selectionLimit: 1,
            quality: 0.8,
        });

        if (result.didCancel) {
            return;
        }

        if (result.errorCode) {
            console.log(result.errorMessage);
            return;
        }

        if (result.assets && result.assets.length > 0) {
            setSelectedMedia(result.assets[0]);
        }
    };

    const privacyLabel =
        phamViHienThi === '0'
            ? 'Cộng đồng'
            : phamViHienThi === '1'
                ? 'Bạn bè'
                : 'Người được phép xem';

    const dangBai = async () => {
        if (!caption.trim() && !selectedMedia) {
            Alert.alert(
                'Thông báo',
                'Bạn hãy nhập nội dung hoặc chọn ảnh/video.'
            );
            return;
        }

        try {
            const formData = new FormData();

            formData.append('id_nguoi_dung', '1');
            formData.append('caption', caption.trim());
            formData.append(
                'pham_vi_hien_thi',
                phamViHienThi
            );

            if (selectedMedia?.uri) {
                const isVideo = selectedMedia.type?.startsWith('video') || 
                                selectedMedia.uri.toLowerCase().endsWith('.mp4') || 
                                selectedMedia.uri.toLowerCase().endsWith('.mov');
                const ext = isVideo ? 'mp4' : (selectedMedia.type?.includes('png') ? 'png' : 'jpg');
                const fileName = selectedMedia.fileName || `sportfeed_${Date.now()}.${ext}`;
                const fileType = selectedMedia.type || (isVideo ? 'video/mp4' : 'image/jpeg');

                formData.append('media', {
                    uri: Platform.OS === 'android' ? selectedMedia.uri : selectedMedia.uri.replace('file://', ''),
                    type: fileType,
                    name: fileName,
                } as any);
            }

            console.log('Đang gửi bài đăng...');

            const response = await api.post(
                '/bai-dang',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    transformRequest: (data) => data, // prevent Axios from converting FormData to JSON
                }
            );

            console.log('Kết quả đăng bài:', response.data);

            if (response.data.status) {
                Alert.alert(
                    'Thành công',
                    'Đăng bài thành công'
                );

                setCaption('');
                setSelectedMedia(null);
                setShowCreatePost(false);

                await loadBaiDang();
            }

        } catch (error: any) {
            console.log(
                'Lỗi đăng bài:',
                error.response?.data || error.message
            );

            Alert.alert(
                'Lỗi đăng bài',
                error.response?.data?.message ||
                error.message ||
                'Không thể đăng bài'
            );
        }
    };
    const loadBaiDang = async () => {
        try {
            const response = await api.get('/bai-dang');

            if (response.data.status) {
                const data = response.data.data.map((item: any) => ({
                    ...item,

                    ten_nguoi_dung: item.ten_nguoi_dung || 'Thành viên VisionFit',

                    avatar: item.avatar || 'VF',

                    anh_dai_dien: item.anh_dai_dien ? resolveMediaUrl(item.anh_dai_dien) : null,

                    media: (item.media || []).map((media: any) => ({
                        ...media,
                        media_url: resolveMediaUrl(media.media_url),
                    })),
                }));

                setBaiDang(data);
            }
        } catch (error) {
            console.log('Lỗi load bài đăng:', error);
        }
    };

    const toggleLike = async (item: BaiDang) => {
        try {
            if (item.da_thich) {
                await api.delete(
                    `/bai-dang/${item.id_bai_dang}/like`
                );
            } else {
                await api.post(
                    `/bai-dang/${item.id_bai_dang}/like`
                );
            }

            setBaiDang(prev =>
                prev.map(post =>
                    post.id_bai_dang === item.id_bai_dang
                        ? {
                            ...post,
                            da_thich: !post.da_thich,
                            so_luot_thich: post.da_thich
                                ? Math.max(
                                    0,
                                    post.so_luot_thich - 1
                                )
                                : post.so_luot_thich + 1,
                        }
                        : post
                )
            );
        } catch (error: any) {
            console.log(
                'Lỗi like:',
                error.response?.data || error.message
            );
        }
    };

    const toggleSave = async (item: BaiDang) => {
        try {
            if (item.da_luu) {
                await api.delete(
                    `/bai-dang/${item.id_bai_dang}/save`
                );
            } else {
                await api.post(
                    `/bai-dang/${item.id_bai_dang}/save`
                );
            }

            setBaiDang(prev =>
                prev.map(post =>
                    post.id_bai_dang === item.id_bai_dang
                        ? {
                            ...post,
                            da_luu: !post.da_luu,
                        }
                        : post
                )
            );
        } catch (error: any) {
            console.log(
                'Lỗi lưu bài:',
                error.response?.data || error.message
            );
        }
    };

    const openComments = async (item: BaiDang) => {
        setSelectedPost(item);
        setShowComments(true);

        await loadComments(item.id_bai_dang);
    };

    const loadSavedPosts = async () => {
        try {
            setLoadingSavedPosts(true);

            const response = await api.get(
                '/bai-dang-da-luu'
            );

            if (response.data.status) {
                const data = (response.data.data || []).map((item: any) => ({
                    ...item,
                    media: (item.media || []).map((m: any) => ({
                        ...m,
                        media_url: resolveMediaUrl(m.media_url),
                    })),
                }));
                setSavedPostsData(data);
            }
        } catch (error: any) {
            console.log(
                'Lỗi lấy bài đã lưu:',
                error.response?.data || error.message
            );
        } finally {
            setLoadingSavedPosts(false);
        }
    };

    const openSavedPosts = async () => {
        setShowSavedPosts(true);
        await loadSavedPosts();
    };

    const boLuuBaiDang = async (item: BaiDang) => {
        try {
            const response = await api.delete(
                `/bai-dang/${item.id_bai_dang}/save`
            );

            if (response.data.status) {
                setSavedPostsData(prev =>
                    prev.filter(
                        post =>
                            post.id_bai_dang !==
                            item.id_bai_dang
                    )
                );

                setBaiDang(prev =>
                    prev.map(post =>
                        post.id_bai_dang ===
                            item.id_bai_dang
                            ? {
                                ...post,
                                da_luu: false,
                            }
                            : post
                    )
                );
            }
        } catch (error: any) {
            console.log(
                'Lỗi bỏ lưu:',
                error.response?.data || error.message
            );
        }
    };

    const toggleLikeComment = async (comment: BinhLuan) => {
        try {
            if (comment.da_thich) {
                await api.delete(
                    `/binh-luan/${comment.id_binh_luan}/like`
                );
            } else {
                await api.post(
                    `/binh-luan/${comment.id_binh_luan}/like`
                );
            }

            setComments(prev =>
                prev.map(item =>
                    item.id_binh_luan === comment.id_binh_luan
                        ? {
                            ...item,
                            da_thich: !item.da_thich,
                            so_luot_thich: item.da_thich
                                ? Math.max(0, item.so_luot_thich - 1)
                                : item.so_luot_thich + 1,
                        }
                        : item
                )
            );
        } catch (error: any) {
            console.log(
                'Lỗi like comment:',
                error.response?.data || error.message
            );
        }
    };

    const guiBinhLuan = async () => {
        if (!commentText.trim() || !selectedPost) {
            return;
        }

        try {

            // ĐANG CHỈNH SỬA
            if (editingComment) {
                const response = await api.put(
                    `/binh-luan/${editingComment.id_binh_luan}`,
                    {
                        noi_dung: commentText.trim(),
                    }
                );

                if (response.data.status) {
                    setEditingComment(null);
                    setCommentText('');

                    await loadComments(
                        selectedPost.id_bai_dang
                    );
                }

                return;
            }

            // COMMENT / REPLY
            const response = await api.post(
                `/bai-dang/${selectedPost.id_bai_dang}/binh-luan`,
                {
                    noi_dung: commentText.trim(),

                    id_binh_luan_cha:
                        replyingTo?.id_binh_luan || null,
                }
            );

            if (response.data.status) {
                setCommentText('');
                setReplyingTo(null);

                await loadComments(
                    selectedPost.id_bai_dang
                );

                setBaiDang(prev =>
                    prev.map(post =>
                        post.id_bai_dang ===
                            selectedPost.id_bai_dang
                            ? {
                                ...post,
                                so_binh_luan:
                                    post.so_binh_luan + 1,
                            }
                            : post
                    )
                );
            }

        } catch (error: any) {
            console.log(
                'Lỗi bình luận:',
                error.response?.data || error.message
            );
        }
    };

    const suaBaiDang = async () => {
        if (!editingPost) {
            return;
        }

        try {
            const response = await api.put(
                `/bai-dang/${editingPost.id_bai_dang}`,
                {
                    caption: editCaption.trim(),
                    pham_vi_hien_thi:
                        editingPost.pham_vi_hien_thi,
                }
            );

            if (response.data.status) {
                setBaiDang(prev =>
                    prev.map(post =>
                        post.id_bai_dang ===
                            editingPost.id_bai_dang
                            ? {
                                ...post,
                                caption: editCaption.trim(),
                            }
                            : post
                    )
                );

                setEditingPost(null);
                setEditCaption('');
            }
        } catch (error: any) {
            Alert.alert(
                'Lỗi',
                error.response?.data?.message ||
                'Không thể chỉnh sửa bài viết'
            );
        }
    };

    const xoaBaiDang = (item: BaiDang) => {
        Alert.alert(
            'Xóa bài viết',
            'Bạn có chắc muốn xóa bài viết này?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.delete(
                                `/bai-dang/${item.id_bai_dang}`
                            );

                            if (response.data.status) {
                                setBaiDang(prev =>
                                    prev.filter(
                                        post =>
                                            post.id_bai_dang !==
                                            item.id_bai_dang
                                    )
                                );

                                setShowPostMenu(null);
                            }
                        } catch (error: any) {
                            Alert.alert(
                                'Lỗi',
                                error.response?.data?.message ||
                                'Không thể xóa bài viết'
                            );
                        }
                    },
                },
            ]
        );
    };
    useEffect(() => {
        loadBaiDang();
    }, []);

    const openCreate = (title: string) => {
        setCreateTitle(title);
        setShowCreateMenu(false);
        setShowCreatePost(true);
    };

    const loadComments = async (idBaiDang: number) => {
        try {
            setLoadingComments(true);

            const response = await api.get(
                `/bai-dang/${idBaiDang}/binh-luan`
            );

            if (response.data.status) {
                setComments(response.data.data);
            }
        } catch (error: any) {
            console.log(
                'Lỗi load bình luận:',
                error.response?.data || error.message
            );
        } finally {
            setLoadingComments(false);
        }
    };

    const xoaBinhLuan = async (comment: BinhLuan) => {
        try {
            const response = await api.delete(
                `/binh-luan/${comment.id_binh_luan}`
            );

            if (response.data.status) {
                setComments(prev =>
                    prev.filter(
                        item =>
                            item.id_binh_luan !==
                            comment.id_binh_luan
                    )
                );

                if (selectedPost) {
                    setBaiDang(prev =>
                        prev.map(post =>
                            post.id_bai_dang ===
                                selectedPost.id_bai_dang
                                ? {
                                    ...post,
                                    so_binh_luan: Math.max(
                                        0,
                                        post.so_binh_luan - 1
                                    ),
                                }
                                : post
                        )
                    );
                }
            }
        } catch (error: any) {
            console.log(
                'Lỗi xóa bình luận:',
                error.response?.data || error.message
            );
        }
    };


    return (
        <SafeAreaView
            style={styles.safe}
            edges={['top']}>

            {/* Chỉ đặt chữ thanh trạng thái màu tối khi tab này đang hiển thị */}
            {isFocused && <StatusBar barStyle="dark-content" />}

            <View style={styles.container}>

                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <View style={styles.brandRow}>
                            <View style={styles.brandDot} />
                            <Text style={styles.brand}>VISIONFIT</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.titleRow}
                            onPress={() => {
                                setShowFilter(!showFilter);
                                setShowCreateMenu(false);
                            }}>
                            <Text style={styles.title}>SportFeed</Text>

                            <Ionicons
                                name="chevron-down"
                                size={18}
                                color={COLORS.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerActions}>

                        {/* BÀI ĐÃ LƯU */}
                        <TouchableOpacity
                            style={styles.savedButton}
                            onPress={openSavedPosts}>

                            <Ionicons
                                name="bookmark-outline"
                                size={21}
                                color={COLORS.primaryDark}
                            />

                        </TouchableOpacity>

                        {/* TẠO BÀI */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                setShowCreateMenu(!showCreateMenu);
                                setShowFilter(false);
                            }}>

                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.addButtonGradient}>
                                <Ionicons
                                    name="add"
                                    size={26}
                                    color={COLORS.white}
                                />
                            </LinearGradient>

                        </TouchableOpacity>

                    </View>
                </View>

                {/* FILTER */}
                {showFilter && (
                    <View style={styles.filterMenu}>
                        <TouchableOpacity style={styles.filterActive}>
                            <Text style={styles.filterActiveText}>Tất cả</Text>
                            <Ionicons
                                name="checkmark"
                                size={19}
                                color="#0D7F8D"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.filterItem}>
                            <Text style={styles.filterText}>Đang theo dõi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.filterItem}>
                            <Text style={styles.filterText}>Thành tích</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.filterItem}>
                            <Text style={styles.filterText}>Mới nhất</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* CREATE MENU */}
                {showCreateMenu && (
                    <View style={styles.createMenu}>

                        <TouchableOpacity
                            style={styles.createItem}
                            onPress={() => openCreate('Tạo bài đăng')}>
                            <View style={[styles.createIconTile, { backgroundColor: COLORS.primaryLight }]}>
                                <Ionicons
                                    name="create-outline"
                                    size={20}
                                    color={COLORS.primary}
                                />
                            </View>

                            <View style={styles.createInfo}>
                                <Text style={styles.createName}>Bài viết</Text>
                                <Text style={styles.createDescription}>
                                    Ảnh, video và nội dung
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.createItem}
                            onPress={() => openCreate('Chia sẻ khoảnh khắc')}>
                            <View style={[styles.createIconTile, { backgroundColor: '#FFF4E5' }]}>
                                <Ionicons
                                    name="flash-outline"
                                    size={20}
                                    color={COLORS.accentGold}
                                />
                            </View>

                            <View style={styles.createInfo}>
                                <Text style={styles.createName}>Khoảnh khắc</Text>
                                <Text style={styles.createDescription}>
                                    Chia sẻ nhanh buổi tập
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.createItem}
                            onPress={() => openCreate('Chia sẻ thành tích')}>
                            <View style={[styles.createIconTile, { backgroundColor: '#FFEDE8' }]}>
                                <Ionicons
                                    name="trophy-outline"
                                    size={20}
                                    color={COLORS.accentOrange}
                                />
                            </View>

                            <View style={styles.createInfo}>
                                <Text style={styles.createName}>
                                    Thành tích tập luyện
                                </Text>

                                <Text style={styles.createDescription}>
                                    Chia sẻ kết quả workout
                                </Text>
                            </View>
                        </TouchableOpacity>

                    </View>
                )}

                {/* FEED */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.feedContent}>

                    {/* QUICK SHARE */}
                    <TouchableOpacity
                        style={styles.quickShare}
                        activeOpacity={0.8}
                        onPress={() => openCreate('Tạo bài đăng')}>

                        <View style={styles.avatarRing}>
                            <View style={styles.myAvatar}>
                                <Text style={styles.avatarText}>N</Text>
                            </View>
                        </View>

                        <View style={styles.quickInput}>
                            <Text style={styles.quickText} numberOfLines={1}>
                                Chia sẻ khoảnh khắc tập luyện...
                            </Text>
                        </View>

                        <LinearGradient
                            colors={[COLORS.accentOrange, COLORS.accentGold]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickMediaTile}>
                            <Ionicons
                                name="images"
                                size={19}
                                color={COLORS.white}
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    {baiDang
                        .filter(item => item.tinh_trang === '1')
                        .map(item => (
                            <View
                                style={styles.post}
                                key={item.id_bai_dang}>

                                <View style={styles.postHeader}>

                                    <View style={styles.avatarRing}>
                                    {item.anh_dai_dien ? (
                                        <Image
                                            source={{
                                                uri: resolveMediaUrl(item.anh_dai_dien),
                                            }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {item.avatar}
                                            </Text>
                                        </View>
                                    )}
                                    </View>

                                    <View style={styles.postUser}>
                                        <Text style={styles.userName}>
                                            {item.ten_nguoi_dung}
                                        </Text>

                                        <View style={styles.postMeta}>
                                            <Text style={styles.postTime}>
                                                {formatTime(item.created_at)}
                                            </Text>

                                            <Text style={styles.dot}>•</Text>

                                            <Ionicons
                                                name={
                                                    item.pham_vi_hien_thi === '0'
                                                        ? 'earth-outline'
                                                        : 'people-outline'
                                                }
                                                size={12}
                                                color="#71949A"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.postMenuWrapper}>

                                        <TouchableOpacity
                                            style={styles.postMoreButton}
                                            onPress={() =>
                                                setShowPostMenu(
                                                    showPostMenu === item.id_bai_dang
                                                        ? null
                                                        : item.id_bai_dang
                                                )
                                            }>

                                            <Ionicons
                                                name="ellipsis-horizontal"
                                                size={20}
                                                color={COLORS.textMuted}
                                            />

                                        </TouchableOpacity>

                                        {showPostMenu === item.id_bai_dang && (
                                            <View style={styles.postMenu}>

                                                {item.id_nguoi_dung === 1 ? (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.postMenuItem}
                                                            onPress={() => {
                                                                setEditingPost(item);
                                                                setEditCaption(item.caption || '');
                                                                setShowPostMenu(null);
                                                            }}>

                                                            <Ionicons
                                                                name="create-outline"
                                                                size={19}
                                                                color="#11343A"
                                                            />

                                                            <Text style={styles.postMenuText}>
                                                                Chỉnh sửa
                                                            </Text>

                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={styles.postMenuItem}
                                                            onPress={() =>
                                                                xoaBaiDang(item)
                                                            }>

                                                            <Ionicons
                                                                name="trash-outline"
                                                                size={19}
                                                                color={COLORS.accentRed}
                                                            />

                                                            <Text style={styles.postDeleteText}>
                                                                Xóa bài viết
                                                            </Text>

                                                        </TouchableOpacity>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.postMenuItem}>

                                                            <Ionicons
                                                                name="flag-outline"
                                                                size={19}
                                                                color="#11343A"
                                                            />

                                                            <Text style={styles.postMenuText}>
                                                                Báo cáo
                                                            </Text>

                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={styles.postMenuItem}>

                                                            <Ionicons
                                                                name="eye-off-outline"
                                                                size={19}
                                                                color="#11343A"
                                                            />

                                                            <Text style={styles.postMenuText}>
                                                                Ẩn bài viết
                                                            </Text>

                                                        </TouchableOpacity>
                                                    </>
                                                )}

                                            </View>
                                        )}

                                    </View>

                                </View>

                                {item.caption ? (
                                    <Text style={styles.caption}>
                                        {item.caption}
                                    </Text>
                                ) : null}

                                {item.media
                                    .sort((a, b) => a.thu_tu - b.thu_tu)
                                    .map(media => (
                                        <View key={media.id_media}>

                                            {/* ẢNH */}
                                            {media.loai_media === 'image' && (
                                                <Image
                                                    source={{
                                                        uri: media.media_url,
                                                    }}
                                                    style={styles.postImage}
                                                    resizeMode="cover"
                                                    resizeMethod="resize"
                                                    onError={event => {
                                                        console.log(
                                                            'Lỗi load ảnh:',
                                                            media.media_url,
                                                            event.nativeEvent.error
                                                        );
                                                    }}
                                                />
                                            )}

                                            {/* VIDEO */}
                                            {media.loai_media === 'video' && (
                                                <View style={styles.videoContainer}>

                                                    <Video
                                                        source={{
                                                            uri: media.media_url,
                                                        }}
                                                        style={styles.postVideo}
                                                        resizeMode="contain"
                                                        paused={
                                                            playingVideoId !== media.id_media
                                                        }
                                                        controls={
                                                            playingVideoId === media.id_media
                                                        }
                                                        onEnd={() =>
                                                            setPlayingVideoId(null)
                                                        }
                                                        onError={error => {
                                                            console.log(
                                                                'Lỗi phát video:',
                                                                media.media_url,
                                                                error
                                                            );
                                                        }}
                                                    />

                                                    {playingVideoId !== media.id_media && (
                                                        <TouchableOpacity
                                                            style={styles.videoPlayOverlay}
                                                            activeOpacity={0.8}
                                                            onPress={() =>
                                                                setPlayingVideoId(
                                                                    media.id_media
                                                                )
                                                            }>

                                                            <View style={styles.videoPlayButton}>
                                                                <Ionicons
                                                                    name="play"
                                                                    size={30}
                                                                    color="#FFFFFF"
                                                                />
                                                            </View>

                                                        </TouchableOpacity>
                                                    )}

                                                </View>
                                            )}

                                        </View>
                                    ))}

                                <View style={styles.actionRow}>

                                    <View style={styles.leftActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                item.da_thich && styles.actionButtonLiked,
                                            ]}
                                            onPress={() => toggleLike(item)}>

                                            <Ionicons
                                                name={
                                                    item.da_thich
                                                        ? 'heart'
                                                        : 'heart-outline'
                                                }
                                                size={20}
                                                color={
                                                    item.da_thich
                                                        ? COLORS.accentRed
                                                        : COLORS.textSecondary
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.actionCount,
                                                    item.da_thich && styles.actionCountLiked,
                                                ]}>
                                                {item.so_luot_thich}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => openComments(item)}>

                                            <Ionicons
                                                name="chatbubble-outline"
                                                size={19}
                                                color={COLORS.textSecondary}
                                            />
                                            <Text style={styles.actionCount}>
                                                {item.so_binh_luan}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionIconButton}>
                                            <Ionicons
                                                name="paper-plane-outline"
                                                size={19}
                                                color={COLORS.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.actionIconButton,
                                            item.da_luu && styles.actionButtonSaved,
                                        ]}
                                        onPress={() => toggleSave(item)}>

                                        <Ionicons
                                            name={
                                                item.da_luu
                                                    ? 'bookmark'
                                                    : 'bookmark-outline'
                                            }
                                            size={19}
                                            color={
                                                item.da_luu
                                                    ? COLORS.primary
                                                    : COLORS.textSecondary
                                            }
                                        />
                                    </TouchableOpacity>

                                </View>

                                <View style={styles.postInfo}>

                                    <Text style={styles.likes}>
                                        {item.so_luot_thich} lượt thích
                                    </Text>

                                    <Text style={styles.postCaption}>
                                        <Text style={styles.captionUser}>
                                            {item.ten_nguoi_dung}{' '}
                                        </Text>

                                        {item.caption}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => openComments(item)}>

                                        <Text style={styles.comments}>
                                            {item.so_binh_luan > 0
                                                ? `Xem ${item.so_binh_luan} bình luận`
                                                : 'Thêm bình luận'}
                                        </Text>
                                    </TouchableOpacity>

                                </View>

                            </View>
                        ))}
                </ScrollView>

                {/* CREATE POST */}
                <Modal
                    visible={showCreatePost}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowCreatePost(false)}>

                    <View style={styles.modalOverlay}>

                        <View style={styles.modalContent}>

                            <View style={styles.modalHandle} />

                            <View style={styles.modalHeader}>

                                <TouchableOpacity
                                    onPress={() => setShowCreatePost(false)}>
                                    <Text style={styles.cancel}>Hủy</Text>
                                </TouchableOpacity>

                                <Text style={styles.modalTitle}>
                                    {createTitle}
                                </Text>

                                <TouchableOpacity
                                    style={styles.publish}
                                    onPress={dangBai}>
                                    <Text style={styles.publishText}>Đăng</Text>
                                </TouchableOpacity>

                            </View>

                            <View style={styles.modalUser}>
                                <View style={styles.myAvatar}>
                                    <Text style={styles.avatarText}>N</Text>
                                </View>

                                <View style={styles.modalUserInfo}>
                                    <Text style={styles.userName}>
                                        Võ Thị Thái Ngọc
                                    </Text>

                                    <Text style={styles.postTime}>
                                        Cộng đồng VisionFit
                                    </Text>
                                </View>
                            </View>

                            <TextInput
                                value={caption}
                                onChangeText={setCaption}
                                multiline
                                style={styles.textArea}
                                placeholder="Bạn muốn chia sẻ điều gì về buổi tập hôm nay?"
                                placeholderTextColor="#8AA3A7"
                            />

                            <TouchableOpacity
                                style={styles.addMedia}
                                onPress={chonMedia}>

                                {selectedMedia ? (
                                    selectedMedia.type?.startsWith('video') ? (
                                        <View style={styles.videoSelected}>
                                            <Ionicons
                                                name="videocam-outline"
                                                size={32}
                                                color="#075E68"
                                            />

                                            <Text style={styles.addMediaText}>
                                                {selectedMedia.fileName || 'Video đã chọn'}
                                            </Text>

                                            <Text style={styles.changeMedia}>
                                                Nhấn để đổi video
                                            </Text>
                                        </View>
                                    ) : (
                                        <Image
                                            source={{ uri: selectedMedia.uri }}
                                            style={styles.previewImage}
                                            resizeMode="cover"
                                        />
                                    )
                                ) : (
                                    <>
                                        <Ionicons
                                            name="image-outline"
                                            size={29}
                                            color="#075E68"
                                        />

                                        <Text style={styles.addMediaText}>
                                            Thêm ảnh hoặc video
                                        </Text>
                                    </>
                                )}

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionRow}
                                onPress={() => {
                                    setShowExercisePicker(!showExercisePicker);
                                    setShowAchievementPicker(false);
                                    setShowPrivacyPicker(false);
                                }}>

                                <View style={styles.optionLeft}>
                                    <Ionicons
                                        name="barbell-outline"
                                        size={21}
                                        color="#11343A"
                                    />

                                    <Text style={styles.optionText}>
                                        Bài tập
                                    </Text>
                                </View>

                                <View style={styles.optionRight}>
                                    <Text style={styles.optionValue}>
                                        {selectedExercise}
                                    </Text>

                                    <Ionicons
                                        name={
                                            showExercisePicker
                                                ? 'chevron-up'
                                                : 'chevron-down'
                                        }
                                        size={17}
                                        color="#71949A"
                                    />
                                </View>
                            </TouchableOpacity>

                            {showExercisePicker && (
                                <View style={styles.pickerBox}>
                                    {['Squat', 'Deadlift', 'Push-up'].map(item => (
                                        <TouchableOpacity
                                            key={item}
                                            style={[
                                                styles.pickerOption,
                                                selectedExercise === item &&
                                                styles.pickerOptionActive,
                                            ]}
                                            onPress={() => {
                                                setSelectedExercise(item);
                                                setShowExercisePicker(false);
                                            }}>

                                            <Text
                                                style={[
                                                    styles.pickerText,
                                                    selectedExercise === item &&
                                                    styles.pickerTextActive,
                                                ]}>
                                                {item}
                                            </Text>

                                            {selectedExercise === item && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="#0D7F8D"
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.optionRow}
                                onPress={() => {
                                    setShowAchievementPicker(!showAchievementPicker);
                                    setShowExercisePicker(false);
                                    setShowPrivacyPicker(false);
                                }}>

                                <View style={styles.optionLeft}>
                                    <Ionicons
                                        name="trophy-outline"
                                        size={21}
                                        color="#11343A"
                                    />

                                    <Text style={styles.optionText}>
                                        Thành tích
                                    </Text>
                                </View>

                                <View style={styles.optionRight}>
                                    <Text
                                        style={
                                            selectedAchievement
                                                ? styles.optionValue
                                                : styles.optionPlaceholder
                                        }>
                                        {selectedAchievement || 'Thêm'}
                                    </Text>

                                    <Ionicons
                                        name={
                                            showAchievementPicker
                                                ? 'chevron-up'
                                                : 'chevron-down'
                                        }
                                        size={17}
                                        color="#71949A"
                                    />
                                </View>
                            </TouchableOpacity>

                            {showAchievementPicker && (
                                <View style={styles.pickerBox}>
                                    {[
                                        'Hoàn thành buổi tập',
                                        'Kỷ lục cá nhân',
                                        'Form đạt trên 80%',
                                    ].map(item => (
                                        <TouchableOpacity
                                            key={item}
                                            style={[
                                                styles.pickerOption,
                                                selectedAchievement === item &&
                                                styles.pickerOptionActive,
                                            ]}
                                            onPress={() => {
                                                setSelectedAchievement(item);
                                                setShowAchievementPicker(false);
                                            }}>

                                            <Text
                                                style={[
                                                    styles.pickerText,
                                                    selectedAchievement === item &&
                                                    styles.pickerTextActive,
                                                ]}>
                                                {item}
                                            </Text>

                                            {selectedAchievement === item && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="#0D7F8D"
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity
                                        style={styles.pickerOption}
                                        onPress={() => {
                                            setSelectedAchievement(null);
                                            setShowAchievementPicker(false);
                                        }}>
                                        <Text style={styles.pickerText}>
                                            Không chọn
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.optionRow}
                                onPress={() => {
                                    setShowPrivacyPicker(!showPrivacyPicker);
                                    setShowExercisePicker(false);
                                    setShowAchievementPicker(false);
                                }}>

                                <View style={styles.optionLeft}>
                                    <Ionicons
                                        name="earth-outline"
                                        size={21}
                                        color="#11343A"
                                    />

                                    <Text style={styles.optionText}>
                                        Ai có thể xem?
                                    </Text>
                                </View>

                                <View style={styles.optionRight}>
                                    <Text style={styles.optionValue}>
                                        {privacyLabel}
                                    </Text>

                                    <Ionicons
                                        name={
                                            showPrivacyPicker
                                                ? 'chevron-up'
                                                : 'chevron-down'
                                        }
                                        size={17}
                                        color="#71949A"
                                    />
                                </View>
                            </TouchableOpacity>

                            {showPrivacyPicker && (
                                <View style={styles.pickerBox}>
                                    {[
                                        { value: '0', label: 'Cộng đồng', icon: 'earth-outline' },
                                        { value: '1', label: 'Bạn bè', icon: 'people-outline' },
                                        { value: '2', label: 'Người được phép xem', icon: 'lock-closed-outline' },
                                    ].map(item => (
                                        <TouchableOpacity
                                            key={item.value}
                                            style={[
                                                styles.pickerOption,
                                                phamViHienThi === item.value &&
                                                styles.pickerOptionActive,
                                            ]}
                                            onPress={() => {
                                                setPhamViHienThi(item.value);
                                                setShowPrivacyPicker(false);
                                            }}>

                                            <View style={styles.optionLeft}>
                                                <Ionicons
                                                    name={item.icon}
                                                    size={19}
                                                    color="#11343A"
                                                />

                                                <Text style={styles.pickerLabel}>
                                                    {item.label}
                                                </Text>
                                            </View>

                                            {phamViHienThi === item.value && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="#0D7F8D"
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                        </View>

                    </View>

                </Modal>

            </View>

            <Modal
                visible={showComments}
                transparent
                animationType="slide"
                onRequestClose={() => setShowComments(false)}>

                <View style={styles.commentOverlay}>

                    <View style={styles.commentModal}>

                        <View style={styles.commentHandle} />

                        <View style={styles.commentHeader}>
                            <Text style={styles.commentTitle}>
                                Bình luận
                            </Text>

                            <TouchableOpacity
                                style={styles.sheetCloseBtn}
                                onPress={() => setShowComments(false)}>
                                <Ionicons
                                    name="close"
                                    size={20}
                                    color={COLORS.textPrimary}
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.commentList}
                            showsVerticalScrollIndicator={false}>

                            {loadingComments ? (
                                <Text style={styles.commentLoading}>
                                    Đang tải bình luận...
                                </Text>
                            ) : comments.length === 0 ? (
                                <View style={styles.commentEmpty}>
                                    <Ionicons
                                        name="chatbubbles-outline"
                                        size={42}
                                        color="#9AB4B8"
                                    />

                                    <Text style={styles.commentEmptyTitle}>
                                        Chưa có bình luận
                                    </Text>

                                    <Text style={styles.commentEmptyText}>
                                        Hãy là người đầu tiên bình luận.
                                    </Text>
                                </View>
                            ) : (
                                comments.map(comment => (
                                    <View
                                        key={comment.id_binh_luan}
                                        style={[
                                            styles.commentItem,
                                            comment.id_binh_luan_cha
                                                ? styles.replyComment
                                                : undefined,
                                        ]}>

                                        <View style={styles.commentAvatar}>
                                            <Text style={styles.avatarText}>
                                                {comment.ten_nguoi_dung
                                                    ?.split(' ')
                                                    .slice(-2)
                                                    .map(x => x.charAt(0))
                                                    .join('')
                                                    .toUpperCase()}
                                            </Text>
                                        </View>

                                        <View style={styles.commentContent}>
                                            <View style={styles.commentBubble}>
                                                <Text style={styles.commentUser}>
                                                    {comment.ten_nguoi_dung}
                                                </Text>

                                                <Text style={styles.commentBody}>
                                                    {comment.noi_dung}
                                                </Text>
                                            </View>

                                            <Text style={styles.commentTime}>
                                                {formatTime(comment.created_at)}
                                            </Text>

                                            <View style={styles.commentActions}>

                                                <TouchableOpacity
                                                    onPress={() =>
                                                        toggleLikeComment(comment)
                                                    }>

                                                    <Text
                                                        style={[
                                                            styles.commentActionText,
                                                            comment.da_thich &&
                                                            styles.commentLikedText,
                                                        ]}>
                                                        Thích
                                                    </Text>

                                                </TouchableOpacity>

                                                {comment.so_luot_thich > 0 && (
                                                    <Text style={styles.commentLikeCount}>
                                                        {comment.so_luot_thich}
                                                    </Text>
                                                )}

                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setReplyingTo(comment);
                                                        setEditingComment(null);
                                                        setCommentText('');
                                                    }}>

                                                    <Text style={styles.commentActionText}>
                                                        Trả lời
                                                    </Text>

                                                </TouchableOpacity>

                                            </View>
                                        </View>

                                        {comment.id_nguoi_dung === 1 && (
                                            <View style={styles.commentMenuWrapper}>

                                                <TouchableOpacity
                                                    style={styles.commentMoreButton}
                                                    onPress={() =>
                                                        setShowCommentMenu(
                                                            showCommentMenu === comment.id_binh_luan
                                                                ? null
                                                                : comment.id_binh_luan
                                                        )
                                                    }>

                                                    <Ionicons
                                                        name="ellipsis-horizontal"
                                                        size={20}
                                                        color="#71949A"
                                                    />

                                                </TouchableOpacity>

                                                {showCommentMenu === comment.id_binh_luan && (
                                                    <View style={styles.commentMenu}>

                                                        <TouchableOpacity
                                                            style={styles.commentMenuItem}
                                                            onPress={() => {
                                                                setEditingComment(comment);
                                                                setReplyingTo(null);

                                                                setCommentText(
                                                                    comment.noi_dung
                                                                );

                                                                setShowCommentMenu(null);
                                                            }}>

                                                            <Ionicons
                                                                name="create-outline"
                                                                size={18}
                                                                color="#11343A"
                                                            />

                                                            <Text style={styles.commentMenuText}>
                                                                Chỉnh sửa
                                                            </Text>

                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={styles.commentMenuItem}
                                                            onPress={() => {
                                                                setShowCommentMenu(null);
                                                                xoaBinhLuan(comment);
                                                            }}>

                                                            <Ionicons
                                                                name="trash-outline"
                                                                size={18}
                                                                color={COLORS.accentRed}
                                                            />

                                                            <Text style={styles.commentDeleteText}>
                                                                Xóa
                                                            </Text>

                                                        </TouchableOpacity>

                                                    </View>
                                                )}

                                            </View>
                                        )}

                                    </View>
                                ))
                            )}

                        </ScrollView>

                        {replyingTo && (
                            <View style={styles.inputModeBar}>

                                <Text style={styles.inputModeText}>
                                    Đang trả lời {replyingTo.ten_nguoi_dung}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setReplyingTo(null)}>

                                    <Ionicons
                                        name="close"
                                        size={18}
                                        color="#71949A"
                                    />

                                </TouchableOpacity>

                            </View>
                        )}

                        {editingComment && (
                            <View style={styles.inputModeBar}>

                                <Text style={styles.inputModeText}>
                                    Đang chỉnh sửa bình luận
                                </Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingComment(null);
                                        setCommentText('');
                                    }}>

                                    <Ionicons
                                        name="close"
                                        size={18}
                                        color="#71949A"
                                    />

                                </TouchableOpacity>

                            </View>
                        )}

                        <View style={styles.commentInputRow}>

                            <View style={styles.myAvatar}>
                                <Text style={styles.avatarText}>
                                    TN
                                </Text>
                            </View>

                            <View style={styles.commentInputPill}>
                                <TextInput
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    placeholder="Thêm bình luận..."
                                    placeholderTextColor={COLORS.textLight}
                                    style={styles.commentInput}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={guiBinhLuan}
                                disabled={!commentText.trim()}>

                                <Text
                                    style={[
                                        styles.sendComment,
                                        !commentText.trim() &&
                                        styles.sendCommentDisabled,
                                    ]}>
                                    Đăng
                                </Text>
                            </TouchableOpacity>

                        </View>

                    </View>

                </View>
            </Modal>

            <Modal
                visible={showSavedPosts}
                animationType="slide"
                onRequestClose={() => setShowSavedPosts(false)}>

                <SafeAreaView style={styles.savedContainer}>

                    <View style={styles.savedHeader}>

                        <TouchableOpacity
                            style={styles.savedBackBtn}
                            onPress={() => setShowSavedPosts(false)}>

                            <Ionicons
                                name="arrow-back"
                                size={21}
                                color={COLORS.textPrimary}
                            />

                        </TouchableOpacity>

                        <Text style={styles.savedTitle}>
                            Bài viết đã lưu
                        </Text>

                        <View style={{ width: 40 }} />

                    </View>

                    {loadingSavedPosts ? (
                        <Text style={styles.savedMessage}>
                            Đang tải...
                        </Text>
                    ) : savedPostsData.length === 0 ? (
                        <View style={styles.savedEmpty}>

                            <Ionicons
                                name="bookmark-outline"
                                size={55}
                                color="#9AB4B8"
                            />

                            <Text style={styles.savedEmptyTitle}>
                                Chưa có bài viết đã lưu
                            </Text>

                            <Text style={styles.savedEmptyText}>
                                Những bài bạn lưu sẽ xuất hiện ở đây.
                            </Text>

                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.savedList}>

                            {savedPostsData.map(item => (
                                <View
                                    key={item.id_bai_dang}
                                    style={styles.savedPost}>

                                    <View style={styles.savedPostHeader}>

                                        <View>
                                            <Text style={styles.savedUser}>
                                                {item.ten_nguoi_dung}
                                            </Text>

                                            <Text style={styles.savedTime}>
                                                {formatTime(item.created_at)}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() =>
                                                boLuuBaiDang(item)
                                            }>

                                            <Ionicons
                                                name="bookmark"
                                                size={24}
                                                color="#0D7F8D"
                                            />

                                        </TouchableOpacity>

                                    </View>

                                    {!!item.caption && (
                                        <Text style={styles.savedCaption}>
                                            {item.caption}
                                        </Text>
                                    )}

                                    {item.media?.length > 0 &&
                                        item.media[0].loai_media ===
                                        'image' && (
                                            <Image
                                                source={{
                                                    uri: item.media[0]
                                                        .media_url,
                                                }}
                                                style={styles.savedImage}
                                                resizeMode="cover"
                                            />
                                        )}

                                </View>
                            ))}

                        </ScrollView>
                    )}

                </SafeAreaView>

            </Modal>
            <Modal
                visible={editingPost !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setEditingPost(null)}>

                <View style={styles.editPostOverlay}>

                    <View style={styles.editPostModal}>

                        <View style={styles.modalHandle} />

                        <View style={styles.editPostHeader}>

                            <TouchableOpacity
                                onPress={() => {
                                    setEditingPost(null);
                                    setEditCaption('');
                                }}>
                                <Text style={styles.editCancel}>
                                    Hủy
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.editPostTitle}>
                                Chỉnh sửa bài viết
                            </Text>

                            <TouchableOpacity
                                onPress={suaBaiDang}>
                                <Text style={styles.editSave}>
                                    Lưu
                                </Text>
                            </TouchableOpacity>

                        </View>

                        <TextInput
                            value={editCaption}
                            onChangeText={setEditCaption}
                            multiline
                            placeholder="Nội dung bài viết..."
                            placeholderTextColor="#8AA3A7"
                            style={styles.editPostInput}
                        />

                    </View>

                </View>

            </Modal>

        </SafeAreaView>
    );
};

export default SportFeed;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // HEADER
    header: {
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 14,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...SHADOWS.card,
        zIndex: 50,
    },

    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    brandDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accentOrange,
        marginRight: 6,
    },

    brand: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        color: COLORS.primary,
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginRight: 5,
    },

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    savedButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.primarySoft,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },

    addButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        ...SHADOWS.glow,
    },

    addButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // DROPDOWNS
    filterMenu: {
        position: 'absolute',
        top: 84,
        left: 16,
        width: 220,
        padding: 6,
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        zIndex: 100,
        ...SHADOWS.card,
        shadowOpacity: 0.14,
        elevation: 10,
    },

    filterActive: {
        height: 44,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        paddingHorizontal: 13,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    filterItem: {
        height: 44,
        justifyContent: 'center',
        paddingHorizontal: 13,
    },

    filterText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },

    filterActiveText: {
        color: COLORS.primaryDark,
        fontWeight: '700',
    },

    createMenu: {
        position: 'absolute',
        top: 80,
        right: 14,
        width: 255,
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 6,
        zIndex: 100,
        ...SHADOWS.card,
        shadowOpacity: 0.14,
        elevation: 10,
    },

    createItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        paddingHorizontal: 12,
    },

    createIconTile: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },

    createInfo: {
        marginLeft: 12,
        flex: 1,
    },

    createName: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },

    createDescription: {
        color: COLORS.textMuted,
        fontSize: 11.5,
        marginTop: 2,
    },

    // FEED
    feedContent: {
        paddingTop: 4,
        paddingBottom: 24,
    },

    quickShare: {
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 14,
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.card,
    },

    avatarRing: {
        padding: 2,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: COLORS.primaryLight,
    },

    myAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
    },

    avatarText: {
        color: COLORS.white,
        fontWeight: '800',
    },

    quickInput: {
        flex: 1,
        height: 42,
        marginHorizontal: 10,
        paddingHorizontal: 14,
        borderRadius: 21,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        justifyContent: 'center',
    },

    quickText: {
        fontSize: 13.5,
        color: COLORS.textMuted,
    },

    quickMediaTile: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // POST CARD
    post: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingBottom: 4,
        ...SHADOWS.card,
    },

    postHeader: {
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 20,
    },

    postUser: {
        flex: 1,
        marginLeft: 10,
    },

    postMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 1,
    },

    dot: {
        marginHorizontal: 5,
        color: COLORS.textLight,
        fontSize: 11,
    },

    userName: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    postTime: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },

    caption: {
        paddingHorizontal: 14,
        paddingBottom: 12,
        color: COLORS.textPrimary,
        fontSize: 14,
        lineHeight: 21,
    },

    postImage: {
        height: 340,
        marginHorizontal: 12,
        marginBottom: 6,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceTeal,
    },

    actionRow: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    actionButton: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    actionButtonLiked: {
        backgroundColor: '#FEECEC',
        borderColor: '#FBD5D5',
    },

    actionButtonSaved: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.borderFocus,
    },

    actionIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },

    actionCount: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },

    actionCountLiked: {
        color: COLORS.accentRed,
    },

    postInfo: {
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 12,
    },

    likes: {
        fontWeight: '700',
        fontSize: 13,
        color: COLORS.textPrimary,
    },

    postCaption: {
        marginTop: 4,
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 19,
    },

    captionUser: {
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    comments: {
        marginTop: 6,
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },

    // CREATE POST MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17,52,58,0.4)',
        justifyContent: 'flex-end',
    },

    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 18,
        paddingBottom: 25,
        minHeight: '75%',
    },

    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 14,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    cancel: {
        color: COLORS.textMuted,
        fontWeight: '600',
        fontSize: 14,
    },

    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    publish: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 18,
        height: 36,
        justifyContent: 'center',
        borderRadius: 18,
        ...SHADOWS.glow,
    },

    publishText: {
        color: COLORS.white,
        fontWeight: '800',
    },

    modalUser: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },

    modalUserInfo: {
        marginLeft: 11,
    },

    textArea: {
        minHeight: 110,
        marginTop: 14,
        marginBottom: 12,
        padding: 14,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        fontSize: 15,
        color: COLORS.textPrimary,
        textAlignVertical: 'top',
    },

    addMedia: {
        height: 130,
        backgroundColor: COLORS.primarySoft,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: COLORS.borderFocus,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },

    addMediaText: {
        color: COLORS.primaryDark,
        fontWeight: '700',
        marginTop: 7,
    },

    optionRow: {
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },

    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    optionText: {
        marginLeft: 12,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },

    optionValue: {
        color: COLORS.primary,
        fontWeight: '700',
    },

    optionPlaceholder: {
        color: COLORS.textMuted,
    },

    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },

    videoSelected: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    changeMedia: {
        marginTop: 5,
        fontSize: 11,
        color: COLORS.textMuted,
    },

    optionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    pickerBox: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 6,
        marginTop: 8,
        marginBottom: 8,
    },

    pickerOption: {
        minHeight: 44,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
    },

    pickerOptionActive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
    },

    pickerText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },

    pickerTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },

    pickerLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
    },

    // COMMENTS SHEET
    commentOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17,52,58,0.4)',
        justifyContent: 'flex-end',
    },

    commentModal: {
        height: '62%',
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
    },

    commentHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 12,
    },

    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },

    commentTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    sheetCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    commentEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },

    commentEmptyTitle: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    commentEmptyText: {
        marginTop: 4,
        fontSize: 13,
        color: COLORS.textMuted,
    },

    commentInputRow: {
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },

    commentInputPill: {
        flex: 1,
        height: 42,
        marginHorizontal: 10,
        paddingHorizontal: 14,
        borderRadius: 21,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
    },

    commentInput: {
        fontSize: 14,
        color: COLORS.textPrimary,
        paddingVertical: 0,
    },

    sendComment: {
        color: COLORS.primary,
        fontWeight: '800',
        fontSize: 14,
        paddingHorizontal: 4,
    },

    sendCommentDisabled: {
        opacity: 0.35,
    },

    commentList: {
        flex: 1,
    },

    commentLoading: {
        textAlign: 'center',
        marginTop: 30,
        color: COLORS.textMuted,
    },

    commentItem: {
        flexDirection: 'row',
        paddingVertical: 8,
    },

    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    commentContent: {
        flex: 1,
    },

    commentBubble: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderTopLeftRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },

    commentUser: {
        fontSize: 13.5,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    commentBody: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textSecondary,
    },

    commentTime: {
        marginTop: 5,
        marginLeft: 4,
        fontSize: 11,
        color: COLORS.textLight,
    },

    deleteCommentButton: {
        padding: 6,
    },

    commentMenuWrapper: {
        position: 'relative',
    },

    commentMoreButton: {
        padding: 6,
    },

    commentMenu: {
        position: 'absolute',
        right: 5,
        top: 30,
        width: 140,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 5,
        ...SHADOWS.card,
        shadowOpacity: 0.14,
        elevation: 8,
        zIndex: 100,
    },

    commentMenuItem: {
        minHeight: 42,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },

    commentMenuText: {
        marginLeft: 9,
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },

    commentDeleteText: {
        marginLeft: 9,
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.accentRed,
    },

    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginLeft: 4,
        gap: 14,
    },

    commentActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
    },

    commentLikedText: {
        color: COLORS.accentRed,
    },

    commentLikeCount: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginLeft: -8,
    },

    replyComment: {
        marginLeft: 46,
    },

    inputModeBar: {
        height: 38,
        paddingHorizontal: 12,
        marginTop: 6,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    inputModeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primaryDark,
    },

    // SAVED POSTS
    savedContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    savedHeader: {
        height: 60,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    savedBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    savedTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    savedMessage: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.textMuted,
    },

    savedEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    savedEmptyTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    savedEmptyText: {
        marginTop: 5,
        fontSize: 13,
        color: COLORS.textMuted,
    },

    savedList: {
        paddingTop: 14,
        paddingBottom: 30,
    },

    savedPost: {
        marginHorizontal: 16,
        marginBottom: 14,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },

    savedPostHeader: {
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    savedUser: {
        fontSize: 14.5,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    savedTime: {
        marginTop: 2,
        fontSize: 11.5,
        color: COLORS.textMuted,
    },

    savedCaption: {
        paddingHorizontal: 14,
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textSecondary,
    },

    savedImage: {
        height: 260,
        marginHorizontal: 12,
        marginTop: 4,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceTeal,
    },

    // POST MENU
    postMenuWrapper: {
        position: 'relative',
    },

    postMoreButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    postMenu: {
        position: 'absolute',
        right: 0,
        top: 40,
        width: 170,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 5,
        zIndex: 200,
        ...SHADOWS.card,
        shadowOpacity: 0.14,
        elevation: 10,
    },

    postMenuItem: {
        minHeight: 44,
        paddingHorizontal: 13,
        flexDirection: 'row',
        alignItems: 'center',
    },

    postMenuText: {
        marginLeft: 10,
        fontSize: 13.5,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },

    postDeleteText: {
        marginLeft: 10,
        fontSize: 13.5,
        fontWeight: '500',
        color: COLORS.accentRed,
    },

    // EDIT POST
    editPostOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17,52,58,0.4)',
        justifyContent: 'flex-end',
    },

    editPostModal: {
        minHeight: '45%',
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 18,
        paddingBottom: 25,
    },

    editPostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    editPostTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    editCancel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
    },

    editSave: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },

    editPostInput: {
        minHeight: 150,
        marginTop: 18,
        padding: 14,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        fontSize: 15,
        color: COLORS.textPrimary,
        textAlignVertical: 'top',
    },

    // VIDEO
    videoContainer: {
        height: 340,
        marginHorizontal: 12,
        marginBottom: 6,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: COLORS.black,
        position: 'relative',
    },

    postVideo: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.black,
    },

    videoPlayOverlay: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },

    videoPlayButton: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
