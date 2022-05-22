import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toaster } from 'evergreen-ui';

import { useCurrentUser } from 'context/usercontext';
import { rootDomain } from 'lib/constants';
import * as ga from 'lib/ga';
import PrimaryButton, { PrimaryLink } from 'components/PrimaryButton';
import styles from './styles.module.css';

interface Buddy {
  profile_pic: string;
  username: string;
  display_name: string;
  id: string;
  hometown?: string;
  bio?: string;
}

interface Props {
  loc: string;
  buddies: Buddy[];
}

export default function BuddyCarousel(props: Props) {
  React.useEffect(() => {
    props.buddies.map(partner => (
      ga.event({
        action: "view_item",
        params: {
          eventLabel: partner.id,
          items: [{
            item_list_name: props.loc,
            item_name: 'Partner',
            item_brand: partner.id,
            item_category: 'Partner',
          }]
        }
      })
    ))
  }, [])

  const { state } = useCurrentUser();

  const onReachOutClick = (partner: Buddy) => {
    ga.event({
      action: "purchase",
      params: {
        eventLabel: partner.id,
        items: [{
          item_list_name: props.loc,
          item_name: 'Partner',
          item_brand: partner.id,
          item_category: 'Partner',
        }]
      }
    })
    fetch(`${rootDomain}/partner/connect`, {
      method: 'POST',
      body: JSON.stringify({
        userId: partner.id,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': Cookies.get('csrf_access_token') || '',
      },
    }).then(res =>
      res.json()
    ).then(
      res => toaster.success(res.msg)
    )
  }

  return (
    <div className={styles.partnerOuterContainer}>
      <h3 className={styles.partnerTitle}>Find a Dive Buddy</h3>
      <div className={styles.partnerInnerContainer}>
        {
          props.buddies.map(partner => (
            <div key={partner.id} className={styles.partnerContainer}>
              <div className={styles.userLockup}>
                <Image
                  className={styles.profilePic}
                  src={partner.profile_pic || 'https://snorkel.s3.amazonaws.com/default/default_hero_background.png'}
                  width="64"
                  height="64"
                />
                <div className={styles.nameLockup}>
                  <Link
                    href={`/user/${partner.username}`}
                  >
                    <a className={styles.name}>
                      {partner.display_name}
                    </a>
                  </Link>
                  <div className={styles.hometown}>{partner.hometown}</div>
                </div>
              </div>
              <div className={styles.bio}>{partner.bio}</div>
              {state.user && state.user.id
                ? <PrimaryButton
                  onClick={() => onReachOutClick(partner)}
                >
                  Message
                </PrimaryButton>
                : <PrimaryLink
                  onClick={() => {
                    ga.event({
                      action: "add_to_cart",
                      params: {
                        eventLabel: partner.id,
                        items: [{
                          item_list_name: props.loc,
                          item_name: 'Partner',
                          item_brand: partner.id,
                          item_category: 'Partner',
                        }]
                      }
                    })
                  }}
                  href='/register'
                >
                  Message
                </PrimaryLink>
              }
            </div>
          ))
        }
        <div className={styles.partnerContainer}>
          Want to get matched up with a dive buddy in your area?
          <PrimaryLink
            onClick={() => {
              ga.event({
                action: "add_to_cart",
                params: {
                  eventLabel: 'Pro',
                  items: [{
                    item_list_name: props.loc,
                    item_name: 'Pro',
                    item_brand: props.loc,
                    item_category: 'Pro',
                  }]
                }
              })
            }}
            href={'https://buy.stripe.com/00gcPhf2Octp3nOaEE'}
          >
            Get Zentacle Pro
          </PrimaryLink>
        </div>
      </div>
    </div>
  );
}