<script>
    import Header from "./Header.svelte"
    import SectionHeader from "./SectionHeader.svelte"
    import SectionSubHeader from "./SectionSubHeader.svelte"
    import FlatButton from "./FlatButton.svelte"
    import FixtureGroup from "./FixtureGroup.svelte"
    import HomeAwayHeader from "./HomeAwayHeader.svelte"
    import Advert from "./Advert.svelte"
    // import { GraphQLClient } from "graphql-request"

    // const query = `
    // query LoginMethods($input: LoginMethodsInput!) {
    //     loginMethods(input: $input)
    // }`

    // const client = new GraphQLClient("https://api.testing.betr.app/graphql", {
    //     headers: {},
    // })
    // client
    //     .request(query, {
    //         input: {
    //             brandId: "b47818be-ed28-4385-8498-d9be160e9417",
    //             phone: "44 7730773398",
    //         },
    //     })
    //     .then(data => console.log(data))
</script>

<style>
    main {
        text-align: center;
        margin: 0 auto;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
    .button-row {
        display: flex;
    }
</style>

<Header />
<main>
    <Advert />
    <SectionHeader name="Popular Leagues" />
    <div class="button-row">
        <FlatButton amount="34">Premier League</FlatButton>
        <FlatButton amount="42">Bundesliga</FlatButton>
    </div>
    <div class="button-row">
        <FlatButton amount="14">La Liga</FlatButton>
        <FlatButton amount="7">France Ligue</FlatButton>
    </div>
    <SectionHeader name="Live Now" />
    <SectionSubHeader>
        <HomeAwayHeader title="Bundesliga 1" />
    </SectionSubHeader>
    <FixtureGroup />
    <FixtureGroup />
</main>
