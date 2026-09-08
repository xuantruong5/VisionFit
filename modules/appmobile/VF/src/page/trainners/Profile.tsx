import { StyleSheet, Text } from "react-native";

const Profile = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello Profile</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default Profile;