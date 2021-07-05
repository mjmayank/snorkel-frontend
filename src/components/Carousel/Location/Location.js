import styles from "./Location.module.css"
import { Card } from "@material-ui/core";
import { CardContent } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import Image from "next/image";
const SlideLocation = ({...props}) => {
    
    return(
        <Card className={styles.slide}>
            <div className={styles.slidepic}>
                <Image className={styles.image} src="/../public/homepageimg.jpg" alt="picture" objectFit="contain" layout="fill"></Image>
                </div>
                <div className={styles.locationtext}>
                    Mala Wharf
                    <br></br>
                    stars
                    
                    
                </div>
                
        </Card>
    )
}

export default SlideLocation;