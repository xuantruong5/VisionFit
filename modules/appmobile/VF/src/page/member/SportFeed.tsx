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

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../general/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { launchImageLibrary, Asset, } from 'react-native-image-picker';

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
                formData.append(
                    'media',
                    {
                        uri: selectedMedia.uri,
                        type: selectedMedia.type || 'image/jpeg',
                        name: selectedMedia.fileName || 'sportfeed.jpg',
                    } as any
                );
            }

            console.log('Đang gửi bài đăng...');

            const response = await api.post(
                '/bai-dang',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
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

                    anh_dai_dien: item.anh_dai_dien || null,

                    media: (item.media || []).map((media: any) => ({
                        ...media,
                        media_url: media.media_url?.replace(
                            '127.0.0.1',
                            '10.0.2.2'
                        ),
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
                setSavedPostsData(response.data.data);
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

            <StatusBar barStyle="dark-content" />

            <View style={styles.container}>

                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>VISIONFIT</Text>

                        <TouchableOpacity
                            style={styles.titleRow}
                            onPress={() => {
                                setShowFilter(!showFilter);
                                setShowCreateMenu(false);
                            }}>
                            <Text style={styles.title}>SportFeed</Text>

                            <Ionicons
                                name="chevron-down"
                                size={17}
                                color="#11343A"
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
                                size={24}
                                color="#075E68"
                            />

                        </TouchableOpacity>

                        {/* TẠO BÀI */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                setShowCreateMenu(!showCreateMenu);
                                setShowFilter(false);
                            }}>

                            <Ionicons
                                name="add"
                                size={27}
                                color="#075E68"
                            />

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
                            <Ionicons
                                name="create-outline"
                                size={22}
                                color="#11343A"
                            />

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
                            <Ionicons
                                name="flash-outline"
                                size={22}
                                color="#11343A"
                            />

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
                            <Ionicons
                                name="trophy-outline"
                                size={22}
                                color="#11343A"
                            />

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

                        <View style={styles.myAvatar}>
                            <Text style={styles.avatarText}>N</Text>
                        </View>

                        <Text style={styles.quickText}>
                            Chia sẻ khoảnh khắc tập luyện...
                        </Text>

                        <Ionicons
                            name="images-outline"
                            size={22}
                            color="#71949A"
                        />
                    </TouchableOpacity>

                    {baiDang
                        .filter(item => item.tinh_trang === '1')
                        .map(item => (
                            <View
                                style={styles.post}
                                key={item.id_bai_dang}>

                                <View style={styles.postHeader}>

                                    {item.anh_dai_dien ? (
                                        <Image
                                            source={{
                                                uri: item.anh_dai_dien.replace(
                                                    '127.0.0.1',
                                                    '10.0.2.2'
                                                ),
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
                                                size={22}
                                                color="#506E73"
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
                                                                color="#D95B5B"
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
                                            style={styles.actionButton}
                                            onPress={() => toggleLike(item)}>

                                            <Ionicons
                                                name={
                                                    item.da_thich
                                                        ? 'heart'
                                                        : 'heart-outline'
                                                }
                                                size={27}
                                                color={
                                                    item.da_thich
                                                        ? '#E74C3C'
                                                        : '#11343A'
                                                }
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => openComments(item)}>

                                            <Ionicons
                                                name="chatbubble-outline"
                                                size={25}
                                                color="#11343A"
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity>
                                            <Ionicons
                                                name="paper-plane-outline"
                                                size={25}
                                                color="#11343A"
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => toggleSave(item)}>

                                        <Ionicons
                                            name={
                                                item.da_luu
                                                    ? 'bookmark'
                                                    : 'bookmark-outline'
                                            }
                                            size={26}
                                            color={
                                                item.da_luu
                                                    ? '#0D7F8D'
                                                    : '#11343A'
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
                                onPress={() => setShowComments(false)}>
                                <Ionicons
                                    name="close"
                                    size={25}
                                    color="#11343A"
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
                                            <Text style={styles.commentUser}>
                                                {comment.ten_nguoi_dung}
                                            </Text>

                                            <Text style={styles.commentBody}>
                                                {comment.noi_dung}
                                            </Text>

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
                                                                color="#D95B5B"
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

                            <TextInput
                                value={commentText}
                                onChangeText={setCommentText}
                                placeholder="Thêm bình luận..."
                                placeholderTextColor="#8AA3A7"
                                style={styles.commentInput}
                            />

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
                            onPress={() => setShowSavedPosts(false)}>

                            <Ionicons
                                name="arrow-back"
                                size={25}
                                color="#11343A"
                            />

                        </TouchableOpacity>

                        <Text style={styles.savedTitle}>
                            Bài viết đã lưu
                        </Text>

                        <View style={{ width: 25 }} />

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
                        <ScrollView>

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
        backgroundColor: '#FFFFFF',
    },

    container: {
        flex: 1,
        backgroundColor: '#F5FBFC',
    },

    header: {
        height: 76,
        paddingHorizontal: 18,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    brand: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        color: '#0D7F8D',
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    title: {
        fontSize: 27,
        fontWeight: '800',
        color: '#11343A',
        marginRight: 5,
    },

    addButton: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.2,
        borderColor: '#0D7F8D',
        justifyContent: 'center',
        alignItems: 'center',
    },

    filterMenu: {
        position: 'absolute',
        top: 78,
        left: 17,
        width: 215,
        padding: 7,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        zIndex: 100,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },

    filterActive: {
        height: 43,
        backgroundColor: '#E5F7F8',
        borderRadius: 11,
        paddingHorizontal: 13,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    filterItem: {
        height: 43,
        justifyContent: 'center',
        paddingHorizontal: 13,
    },

    filterText: {
        color: '#11343A',
        fontSize: 14,
    },

    filterActiveText: {
        color: '#075E68',
        fontWeight: '700',
    },

    createMenu: {
        position: 'absolute',
        top: 72,
        right: 14,
        width: 245,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 6,
        zIndex: 100,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.09,
        shadowRadius: 12,
    },

    createItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
    },

    createInfo: {
        marginLeft: 13,
    },

    createName: {
        color: '#11343A',
        fontSize: 14,
        fontWeight: '700',
    },

    createDescription: {
        color: '#71949A',
        fontSize: 11,
        marginTop: 2,
    },

    feedContent: {
        paddingBottom: 80,
    },

    quickShare: {
        height: 72,
        marginHorizontal: 12,
        marginVertical: 10,
        paddingHorizontal: 13,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',

        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },

    myAvatar: {
        width: 43,
        height: 43,
        borderRadius: 22,
        backgroundColor: '#20A5B3',
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#10A6B5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },

    quickText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#78979C',
    },

    post: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },

    postHeader: {
        height: 64,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },

    postUser: {
        flex: 1,
        marginLeft: 11,
    },

    postMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    dot: {
        marginHorizontal: 5,
        color: '#71949A',
        fontSize: 11,
    },

    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#11343A',
    },

    postTime: {
        color: '#71949A',
        fontSize: 12,
        marginTop: 2,
    },

    caption: {
        paddingHorizontal: 14,
        paddingBottom: 12,
        color: '#11343A',
        fontSize: 14,
        lineHeight: 20,
    },

    postImage: {
        width: '100%',
        height: 390,
        backgroundColor: '#EAF9FB',
    },

    actionRow: {
        height: 50,
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    leftActions: {
        flexDirection: 'row',
    },

    actionButton: {
        marginRight: 17,
    },

    postInfo: {
        paddingHorizontal: 14,
        paddingBottom: 13,
    },

    likes: {
        fontWeight: '700',
        fontSize: 13,
        color: '#11343A',
    },

    postCaption: {
        marginTop: 5,
        color: '#11343A',
        fontSize: 13,
    },

    captionUser: {
        fontWeight: '700',
    },

    comments: {
        marginTop: 6,
        color: '#83999D',
        fontSize: 13,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
    },

    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 18,
        paddingBottom: 25,
        minHeight: '75%',
    },

    modalHandle: {
        width: 45,
        height: 4,
        backgroundColor: '#DCE4E6',
        borderRadius: 10,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 13,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    cancel: {
        color: '#71949A',
        fontWeight: '600',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#11343A',
    },

    publish: {
        backgroundColor: '#0D7F8D',
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 12,
    },

    publishText: {
        color: '#FFFFFF',
        fontWeight: '700',
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
        marginTop: 18,
        fontSize: 15,
        color: '#11343A',
        textAlignVertical: 'top',
    },

    addMedia: {
        height: 120,
        backgroundColor: '#F1FAFB',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    addMediaText: {
        color: '#075E68',
        fontWeight: '700',
        marginTop: 7,
    },

    optionRow: {
        height: 53,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    optionText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#11343A',
    },

    optionValue: {
        color: '#0D7F8D',
        fontWeight: '600',
    },

    optionPlaceholder: {
        color: '#82999D',
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
        color: '#71949A',
    },

    avatarImage: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },

    optionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    pickerBox: {
        backgroundColor: '#F5FBFC',
        borderRadius: 14,
        padding: 6,
        marginBottom: 8,
    },

    pickerOption: {
        minHeight: 44,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
    },

    pickerOptionActive: {
        backgroundColor: '#E2F6F8',
    },

    pickerText: {
        fontSize: 14,
        color: '#11343A',
    },

    pickerTextActive: {
        color: '#0D7F8D',
        fontWeight: '700',
    },

    pickerLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: '#11343A',
    },

    commentOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
    },

    commentModal: {
        height: '62%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
    },

    commentHandle: {
        width: 45,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D8E3E5',
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 12,
    },

    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D8EEF1',
    },

    commentTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#11343A',
    },

    commentEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    commentEmptyTitle: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '700',
        color: '#11343A',
    },

    commentEmptyText: {
        marginTop: 4,
        fontSize: 13,
        color: '#71949A',
    },

    commentInputRow: {
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#D8EEF1',
    },

    commentInput: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 14,
        color: '#11343A',
    },

    sendComment: {
        color: '#0D7F8D',
        fontWeight: '700',
        fontSize: 14,
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
        color: '#71949A',
    },

    commentItem: {
        flexDirection: 'row',
        paddingVertical: 12,
    },

    commentAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#DDF3F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    commentContent: {
        flex: 1,
    },

    commentUser: {
        fontSize: 14,
        fontWeight: '700',
        color: '#11343A',
    },

    commentBody: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 20,
        color: '#24484E',
    },

    commentTime: {
        marginTop: 4,
        fontSize: 11,
        color: '#8AA3A7',
    },

    deleteCommentButton: {
        padding: 6,
    },

    savedContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    savedHeader: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D8EEF1',
    },

    savedTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#11343A',
    },

    savedMessage: {
        textAlign: 'center',
        marginTop: 40,
        color: '#71949A',
    },

    savedEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    savedEmptyTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '700',
        color: '#11343A',
    },

    savedEmptyText: {
        marginTop: 5,
        fontSize: 13,
        color: '#71949A',
    },

    savedPost: {
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D8EEF1',
    },

    savedPostHeader: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    savedUser: {
        fontSize: 14,
        fontWeight: '700',
        color: '#11343A',
    },

    savedTime: {
        marginTop: 2,
        fontSize: 11,
        color: '#81999D',
    },

    savedCaption: {
        paddingHorizontal: 16,
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14,
        color: '#24484E',
    },

    savedImage: {
        width: '100%',
        height: 280,
    },

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    savedButton: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.2,
        borderColor: '#D8EEF1',
        justifyContent: 'center',
        alignItems: 'center',
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
        width: 135,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 5,
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
        color: '#11343A',
    },

    commentDeleteText: {
        marginLeft: 9,
        fontSize: 13,
        color: '#D95B5B',
    },

    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 14,
    },

    commentActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#71949A',
    },

    commentLikedText: {
        color: '#0D7F8D',
    },

    commentLikeCount: {
        fontSize: 11,
        color: '#71949A',
        marginLeft: -8,
    },

    replyComment: {
        marginLeft: 42,
    },

    inputModeBar: {
        height: 37,
        paddingHorizontal: 8,
        backgroundColor: '#F1FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    inputModeText: {
        fontSize: 12,
        color: '#50757B',
    },

    postMenuWrapper: {
        position: 'relative',
    },

    postMoreButton: {
        padding: 5,
    },

    postMenu: {
        position: 'absolute',
        right: 0,
        top: 32,
        width: 165,
        backgroundColor: '#FFFFFF',
        borderRadius: 13,
        paddingVertical: 5,
        elevation: 10,
        zIndex: 200,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },

    postMenuItem: {
        minHeight: 45,
        paddingHorizontal: 13,
        flexDirection: 'row',
        alignItems: 'center',
    },

    postMenuText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#11343A',
    },

    postDeleteText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#D95B5B',
    },

    editPostOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
    },

    editPostModal: {
        minHeight: '45%',
        backgroundColor: '#FFFFFF',
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
        color: '#11343A',
    },

    editCancel: {
        fontSize: 14,
        color: '#71949A',
    },

    editSave: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0D7F8D',
    },

    editPostInput: {
        minHeight: 150,
        marginTop: 20,
        fontSize: 15,
        color: '#11343A',
        textAlignVertical: 'top',
    },

    videoContainer: {
        width: '100%',
        height: 390,
        backgroundColor: '#000000',
        position: 'relative',
    },

    postVideo: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
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
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});