<script>
    import Odds from "./Odds.svelte"
    import OddsGroup from "./OddsGroup.svelte"
</script>

<style>
    .container {
        background: #001c37;
        color: #ebebeb;
        padding: 7px 12px;
        display: flex;
        justify-content: space-between;
        border-bottom: solid 1px #001427;
    }
    .details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-size: 11px;
        color: #ebebeb;
    }
    .score {
        color: #f1cb01;
        width: 15px;
        text-align: left;
    }
    .team {
        display: flex;
    }
    .team-b {
        margin-top: 3px;
    }
    .info {
        margin-top: 3px;
        color: #909090;
    }
    .odds {
        padding: 0 5px;
        width: 100%;
    }
</style>

<div class="container">
    <div class="details">
        <div class="team">
            <span class="score">1</span>
            <span>Eintracht Frankfurt</span>
        </div>
        <div class="team team-b">
            <span class="score">0</span>
            <span>SC Freiburg</span>
        </div>
        <span class="info">11' 14</span>
    </div>
    <OddsGroup>
        <div class="odds">
            <Odds value="2.00" />
        </div>
        <div class="odds">
            <Odds value="3.75" />
        </div>
        <div class="odds">
            <Odds value="2.00" selected />
        </div>
    </OddsGroup>
</div>
