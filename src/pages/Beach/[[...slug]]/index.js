import { useEffect, useState } from 'react';
import Error from 'next/error'
import Cookies from 'js-cookie';

import { rootDomain } from 'lib/constants';
import { sendEvent } from 'hooks/amplitude';
import { useCurrentUser } from 'context/usercontext';
import BeachInfo from "components/BeachPage/BeachInfo/BeachInfo";
import BeachPageHero from 'components/BeachPageHero';
import BeachReviews from "components/BeachPage/BeachReviews/BeachReviews";
import Breadcrumbs from 'components/Breadcrumbs';
import Carousel from 'components/Carousel/Carousel';
import Head from 'next/head';
import Layout from "components/Layout/Layout";
import MaxWidth from 'components/MaxWidth';
import PhotoPreview from 'components/BeachPage/PhotoPreview';
import ReviewSummary from 'components/BeachPage/ReviewSummary';
import styles from "./styles.module.css";
import useGoogleOneTap from 'hooks/useGoogleOneTap';

export async function getStaticProps(context) {
    const startTime = Date.now();
    const beachid = context.params.slug[0];
    const beachNameFromURL = context.params.slug[1];

    let beach_data = fetch(`${rootDomain}/spots/get?beach_id=${beachid}`)
    let review_data = fetch(`${rootDomain}/reviews/get?beach_id=${beachid}`)
    let nearbyBeaches = fetch(`${rootDomain}/spots/nearby?beach_id=${beachid}`)

    beach_data = await beach_data.then(res => {
        if (res.status == 404) {
            return {
                errorCode: 404,
            }
        }
        return res.json()
    });
    if (!beach_data || (beach_data.errorCode)) {
        return {
            notFound: true,
        }
    }

    // if (!beach_data.country) {
    //     fetch(`${rootDomain}/spot/geocode?id=${beachid}`)
    // }

    if (`/Beach/${beachid}/${beachNameFromURL}` != beach_data.data.url) {
        return {
            redirect: {
                destination: beach_data.data.url,
                permanent: true,
            }
        }
    }

    let stationId = beach_data.data.noaa_station_id;

    let tides = []
    let tideData;
    if (stationId && stationId !== '-1') {
        var currentDate = new Date();
        var begin_date = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
        currentDate.setDate(currentDate.getDate() + 3);
        var end_date = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
        tideData = fetch(
            `${rootDomain}/spot/tide?station_id=${stationId}&begin_date=${begin_date}&end_date=${end_date}`
        )
    }
    // else {
    //     if (beach_data.data.latitude) {
    //         try {
    //             response = await fetch(`https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/tidepredstations.json?lat=${beach_data.data.latitude}&lon=${beach_data.data.longitude}&radius=50`)
    //             const stations_data = await response.json()
    //             if (stations_data.stationList && stations_data.stationList.length) {
    //                 stationId = stations_data.stationList[0].stationId
    //             } else {
    //                 stationId = '-1'
    //             }
    //             response = await fetch(`${rootDomain}/spot/setStationId`, {
    //                 method: 'POST',
    //                 body: JSON.stringify({
    //                     'spotId': beachid,
    //                     'stationId': stationId
    //                 }),
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 }
    //             })
    //         } catch (error) {
    //             console.log(error)
    //         }
    //     }
    // }
    review_data = await review_data.then(resp => resp.json());
    nearbyBeaches = await nearbyBeaches.then(res =>
        res.json()
    ).then(beach_data => {
        if (beach_data.data) {
            return beach_data.data;
        } else {
            return [];
        }
    });
    if (tideData) {
        tideData = await tideData.then(resp => resp.json());
        if (tideData && tideData.predictions) {
            tides = tideData.predictions;
        }
    }

    console.log(`beach_api_timing: ${Date.now() - startTime}ms, id: ${beachid}`)
    return {
        props: {
            'beach': beach_data.data,
            'reviews': review_data.data,
            'tides': tides,
            'nearbyBeaches': nearbyBeaches,
        }, // will be passed to the page component as props
        revalidate: 3600,
    }
}

export async function getStaticPaths() {
    const res = await fetch(`${rootDomain}/spots/get?limit=100&ssg=true`)
    const data = await res.json()
    return {
        paths: data.data.map(beach => ({
            params: {
                slug: [`${beach.id}`, beach.beach_name_for_url]
            }
        })),
        fallback: 'blocking',
    }
}

const Beach = (props) => {
    const [beach, setBeach] = useState(props.beach);
    const [nearbyBeaches, setNearbyBeaches] = useState(props.nearbyBeaches)
    const photoState = useState([]);

    let { state } = useCurrentUser();
    const currentUser = state.user;

    useEffect(() => {
        var ads = document.getElementsByClassName("adsbygoogle").length;
        for (var i = 0; i < ads; i++) {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) { }
        }
    }, [beach.id]);

    useEffect(() => {
        if (currentUser) {
            sendEvent('page_view', {
                type: 'beach',
                site_id: beach.id,
                site_name: beach.name,
            });
        }
    }, [state, currentUser, beach.id, beach.name])

    useEffect(useGoogleOneTap(beach.url, currentUser), [state])
    useEffect(() => setNearbyBeaches(props.nearbyBeaches), [props.nearbyBeaches])
    useEffect(() => setBeach(props.beach), [props.beach])

    if (props.errorCode) {
        return <Error statusCode={props.errorCode} />
    }

    let siteName = props.isShorediving
        ? 'ShoreDiving.com'
        : 'Zentacle'

    let canonicalURL = `https://www.zentacle.com${beach.url}`

    const description = beach.description
        ? `${beach.description} ${beach.name} is a ${Math.round(beach.rating * 100) / 100}-star rated scuba dive and snorkel site in ${beach.location_city}.`
        : `${beach.name} is a ${Math.round(beach.rating * 100) / 100}-star rated scuba dive and snorkel site in ${beach.location_city}.`

    const pageTitle = `${beach.name} in ${beach.location_city} | ${siteName} - Scuba Diving and Snorkel Reviews, Maps, and Photos`

    return (
        <Layout isShorediving={props.isShorediving}>
            <Head>
                <title key="title">{pageTitle}</title>
                <meta property="og:title" content={pageTitle} key="og-title" />
                <meta property="og:description" content={description} key="og-description" />
                <meta property="og:image" content={beach.hero_img} key="og-image" />
                <meta property="og:url" content={canonicalURL} key="og-url" />
                <meta name="description" content={description} key="description" />
                <link rel="canonical" href={canonicalURL} key="canonical" />
                <meta name="apple-itunes-app" content={`app-id=1611242564, app-argument=${beach.url}`} key="apple-app"></meta>
                {beach.num_reviews && <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: `{
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            "name": "${beach.name}",
                            "image": "${beach.hero_img}",
                            "url": "https://www.zentacle.com${beach.url}",
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": "${beach.rating}",
                                "ratingCount": "${beach.num_reviews}"
                            }
                        }`
                    }}
                    key="aggregate-rating-ld"
                />}
            </Head>
            <MaxWidth>
                <div className={`${styles.ad} ${styles.desktopOnly}`} key={beach.id}>
                    <ins className="adsbygoogle"
                        style={{
                            display: 'block',
                            minWidth: '300px',
                            maxWidth: '970px',
                            width: '100%',
                            height: '90px',
                        }}
                        data-ad-client="ca-pub-7099980041278313"
                        data-ad-slot="9831586937"></ins>
                </div>
                <Breadcrumbs
                    country={beach.country}
                    area_one={beach.area_one}
                    area_two={beach.area_two}
                    locality={beach.locality}
                />
                <BeachPageHero beach={beach} />
                <div className={styles.container}>
                    <div className={styles.innerContainer}>
                        <BeachInfo
                            {...beach}
                            isSingularReview={props.isSingularReview}
                            tides={props.tides}
                            reviews={props.reviews}
                        />
                        <PhotoPreview
                            photoState={photoState}
                            beach={beach}
                        />
                        <ReviewSummary
                            ratings={beach.ratings}
                            rating={beach.rating}
                            num_reviews={beach.num_reviews}
                        />
                        <BeachReviews
                            beachid={beach.id}
                            url={beach.url}
                            reviews={props.reviews}
                            isSingularReview={props.isSingularReview}
                        />
                    </div>
                    {nearbyBeaches.length
                        ? <div className={styles.carouselSpacer}>
                            <div className={`${styles.ad} ${styles.adTop}`}>
                                <ins className="adsbygoogle"
                                    style={{
                                        display: 'inline-block',
                                        width: '268px',
                                        height: '250px',
                                    }}
                                    data-ad-client="ca-pub-7099980041278313"
                                    data-ad-slot="9878800345"
                                    key={beach.id}></ins>
                            </div>
                            <div className={styles.carouseltitle}>Other Locations Nearby</div>
                            <Carousel onClick={() => sendEvent('click__nearby_beach')} data={nearbyBeaches} allowVertical />
                            {
                                //<!-- below recommended -->
                            }
                            <div className={styles.ad}>
                                <ins className="adsbygoogle"
                                    style={{ display: 'block' }}
                                    data-ad-client="ca-pub-7099980041278313"
                                    data-ad-slot="4115340371"
                                    data-ad-format="auto"
                                    data-full-width-responsive="true"
                                    key={beach.id}></ins>
                            </div>
                            <div id="312754558">
                                <script
                                    type="text/javascript"
                                    dangerouslySetInnerHTML={{
                                        __html: `
                                        try {
                                            window._mNHandle.queue.push(function () {
                                                window._mNDetails.loadTag("312754558", "300x250", "312754558");
                                            });
                                        }
                                        catch (error) { }
                                    `
                                    }}
                                />
                            </div>
                        </div> : <></>
                    }
                </div>
            </MaxWidth>
        </Layout>
    )
}

export default Beach;
