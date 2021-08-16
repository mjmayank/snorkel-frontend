import Page from 'pages/index';
import { rootDomain } from "src/lib/constants";

export async function getStaticProps(context) {
  const area_two = context.params.area_two;
  const area_one = context.params.area_one;
  const country = context.params.country;
  const sorts = ['top', 'latest', 'default']
  const props = {};
  await Promise.all(sorts.map(async sort => {
    let res;
    res = await fetch(
      `${rootDomain}/spots/get?sort=${sort}&area_one=${area_one}&country=${country}&area_two=${area_two}`
    )
    const data = await res.json()
    props[sort] = data.data || null;
    if (data.area) {
      props['area'] = data.area;
    }
    return data;
  }))

  if (!props.default) {
    return {
      notFound: true,
    }
  }

  return {
    props, // will be passed to the page component as props
    revalidate: 3600,
  }
}

export async function getStaticPaths() {
  const res = await fetch(`${rootDomain}/locality/area_two`)
  const data = await res.json()
  return {
      paths: data.data.map(loc => ({
          params: {
              country: loc.country.short_name,
              area_one: loc.area_one.short_name,
              area_two: loc.short_name,
          }
      })),
      fallback: 'blocking',
  }
}

export default Page