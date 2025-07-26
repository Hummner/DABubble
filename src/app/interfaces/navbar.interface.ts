export interface NavbarInterface {
    createdBy: string,
    description: string,
    members: { uid: string; role: string, name: string, imgUrl: string }[];
    name: string,
    channelId: string
}
