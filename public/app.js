// BlazeSportsIntel - ESPN Fantasy Football Dashboard
// Main Application Logic

class FantasyDashboard {
    constructor() {
        this.currentLeagueId = null;
        this.currentSeasonId = null;
        this.currentScoringPeriodId = null;
        this.isPrivate = false;
        this.espnS2 = null;
        this.swid = null;
        this.cachedData = {};

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedConfig();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Private league checkbox
        document.getElementById('isPrivate').addEventListener('change', (e) => {
            const cookiesDiv = document.getElementById('privateCookies');
            cookiesDiv.style.display = e.target.checked ? 'block' : 'none';
            this.isPrivate = e.target.checked;
        });

        // Load data button
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadAllData());

        // Position filter for free agents
        document.getElementById('positionFilter').addEventListener('change', (e) => {
            if (this.cachedData.freeAgents) {
                this.displayFreeAgents(this.cachedData.freeAgents, e.target.value);
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            const paneId = pane.id.replace('-tab', '');
            pane.classList.toggle('active', paneId === tabName);
        });
    }

    async loadAllData() {
        // Get configuration
        this.currentLeagueId = document.getElementById('leagueId').value;
        this.currentSeasonId = document.getElementById('seasonId').value;
        this.currentScoringPeriodId = document.getElementById('scoringPeriodId').value;

        if (!this.currentLeagueId || !this.currentSeasonId || !this.currentScoringPeriodId) {
            this.showError('Please fill in all required fields (League ID, Season, and Week)');
            return;
        }

        if (this.isPrivate) {
            this.espnS2 = document.getElementById('espnS2').value;
            this.swid = document.getElementById('swid').value;

            if (!this.espnS2 || !this.swid) {
                this.showError('Private leagues require ESPN_S2 and SWID cookies');
                return;
            }
        }

        // Save configuration
        this.saveConfig();

        // Show loading overlay
        this.showLoading(true);

        try {
            // Load all data in parallel
            await Promise.all([
                this.loadLeagueInfo(),
                this.loadStandings(),
                this.loadMatchups()
            ]);

            this.showLoading(false);
            this.showSuccess('League data loaded successfully!');
        } catch (error) {
            this.showLoading(false);
            this.showError(`Failed to load data: ${error.message}`);
        }
    }

    async loadLeagueInfo() {
        try {
            const response = await this.apiCall(
                `/api/league/${this.currentLeagueId}/info?seasonId=${this.currentSeasonId}`
            );

            this.cachedData.leagueInfo = response;
            this.displayLeagueInfo(response);
        } catch (error) {
            console.error('Error loading league info:', error);
            throw error;
        }
    }

    async loadStandings() {
        try {
            const response = await this.apiCall(
                `/api/league/${this.currentLeagueId}/teams?seasonId=${this.currentSeasonId}&scoringPeriodId=${this.currentScoringPeriodId}`
            );

            this.cachedData.teams = response;
            this.displayStandings(response);
        } catch (error) {
            console.error('Error loading standings:', error);
            throw error;
        }
    }

    async loadMatchups() {
        try {
            const response = await this.apiCall(
                `/api/league/${this.currentLeagueId}/boxscores?seasonId=${this.currentSeasonId}&matchupPeriodId=${this.currentScoringPeriodId}&scoringPeriodId=${this.currentScoringPeriodId}`
            );

            this.cachedData.matchups = response;
            this.displayMatchups(response);
        } catch (error) {
            console.error('Error loading matchups:', error);
            throw error;
        }
    }

    async loadFreeAgents() {
        if (this.cachedData.freeAgents) {
            this.displayFreeAgents(this.cachedData.freeAgents);
            return;
        }

        this.showLoading(true);
        try {
            const response = await this.apiCall(
                `/api/league/${this.currentLeagueId}/free-agents?seasonId=${this.currentSeasonId}&scoringPeriodId=${this.currentScoringPeriodId}`
            );

            this.cachedData.freeAgents = response;
            this.displayFreeAgents(response);
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.showError(`Failed to load free agents: ${error.message}`);
        }
    }

    async loadDraft() {
        if (this.cachedData.draft) {
            this.displayDraft(this.cachedData.draft);
            return;
        }

        this.showLoading(true);
        try {
            const response = await this.apiCall(
                `/api/league/${this.currentLeagueId}/draft?seasonId=${this.currentSeasonId}`
            );

            this.cachedData.draft = response;
            this.displayDraft(response);
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.showError(`Failed to load draft data: ${error.message}`);
        }
    }

    async apiCall(endpoint) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.isPrivate && this.espnS2 && this.swid) {
            headers['espnS2'] = this.espnS2;
            headers['SWID'] = this.swid;
        }

        const response = await fetch(endpoint, { headers });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }

        return await response.json();
    }

    displayLeagueInfo(data) {
        const container = document.getElementById('leagueInfo');

        container.innerHTML = `
            <div class="league-details">
                <div class="league-stat">
                    <div class="label">League Name</div>
                    <div class="value">${data.name || 'N/A'}</div>
                </div>
                <div class="league-stat">
                    <div class="label">Season</div>
                    <div class="value">${data.seasonId || 'N/A'}</div>
                </div>
                <div class="league-stat">
                    <div class="label">Teams</div>
                    <div class="value">${data.size || 'N/A'}</div>
                </div>
                <div class="league-stat">
                    <div class="label">Current Week</div>
                    <div class="value">${data.scoringPeriodId || 'N/A'}</div>
                </div>
            </div>
        `;
    }

    displayStandings(teams) {
        const container = document.getElementById('standings');

        // Sort teams by wins
        const sortedTeams = [...teams].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.points - a.points;
        });

        let html = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>W-L</th>
                        <th>PF</th>
                        <th>PA</th>
                        <th>Streak</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedTeams.forEach((team, index) => {
            html += `
                <tr>
                    <td class="team-rank">${index + 1}</td>
                    <td><strong>${team.name || `Team ${team.id}`}</strong></td>
                    <td>${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ''}</td>
                    <td>${team.points?.toFixed(2) || '0.00'}</td>
                    <td>${team.pointsAgainst?.toFixed(2) || '0.00'}</td>
                    <td>${this.getStreakDisplay(team.currentProjectedRank)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    displayMatchups(boxscores) {
        const container = document.getElementById('matchups');

        if (!boxscores || boxscores.length === 0) {
            container.innerHTML = '<p class="empty-state">No matchups found for this week</p>';
            return;
        }

        let html = '';

        boxscores.forEach((matchup, index) => {
            const homeWinner = matchup.homeScore > matchup.awayScore;
            const awayWinner = matchup.awayScore > matchup.homeScore;

            html += `
                <div class="matchup">
                    <div class="matchup-header">
                        <div class="team-score">
                            <span class="team-name ${awayWinner ? 'winner' : ''}">
                                Away Team ${matchup.awayTeamId}
                            </span>
                            <span class="score ${awayWinner ? 'winner' : ''}">
                                ${matchup.awayScore?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                        <span class="vs">vs</span>
                        <div class="team-score">
                            <span class="score ${homeWinner ? 'winner' : ''}">
                                ${matchup.homeScore?.toFixed(2) || '0.00'}
                            </span>
                            <span class="team-name ${homeWinner ? 'winner' : ''}">
                                Home Team ${matchup.homeTeamId}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    displayFreeAgents(freeAgents, positionFilter = 'all') {
        const container = document.getElementById('freeAgents');

        // Load data if not already loaded
        if (!freeAgents) {
            this.loadFreeAgents();
            return;
        }

        let filtered = freeAgents;
        if (positionFilter !== 'all') {
            filtered = freeAgents.filter(player =>
                player.player?.defaultPosition === positionFilter
            );
        }

        // Sort by projected points
        filtered = filtered.slice(0, 50); // Limit to top 50

        let html = '<div class="player-list">';

        filtered.forEach(player => {
            const p = player.player || {};
            html += `
                <div class="player-item">
                    <div class="player-position">${p.defaultPosition || 'N/A'}</div>
                    <div>
                        <div class="player-name">${p.fullName || 'Unknown Player'}</div>
                        <div class="player-team">${p.proTeamAbbreviation || 'FA'}</div>
                    </div>
                    <div class="player-team">
                        ${p.injured ? '<span class="status-badge status-injured">Injured</span>' : ''}
                    </div>
                    <div class="player-projected">Proj: ${player.projectedPoints || 0}</div>
                    <div class="player-points">${player.totalPoints || 0}</div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    displayDraft(draftPicks) {
        const container = document.getElementById('draft');

        // Load data if not already loaded
        if (!draftPicks) {
            this.loadDraft();
            return;
        }

        if (!draftPicks || draftPicks.length === 0) {
            container.innerHTML = '<p class="empty-state">No draft data available</p>';
            return;
        }

        let html = '<div class="draft-list">';

        draftPicks.slice(0, 100).forEach(pick => {
            const player = pick.player || {};
            html += `
                <div class="draft-pick">
                    <div class="pick-number">${pick.overallPickNumber}</div>
                    <div>
                        <div class="pick-player">${player.fullName || 'Unknown Player'}</div>
                        <div class="pick-team">${player.defaultPosition || ''} - ${player.proTeamAbbreviation || ''}</div>
                    </div>
                    <div>Team ${pick.teamId}</div>
                    <div>Round ${pick.roundId}</div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    getStreakDisplay(streak) {
        if (!streak) return '-';
        return streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`;
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        // You could implement a success toast here
        console.log('Success:', message);
    }

    saveConfig() {
        const config = {
            leagueId: this.currentLeagueId,
            seasonId: this.currentSeasonId,
            scoringPeriodId: this.currentScoringPeriodId,
            isPrivate: this.isPrivate
        };

        localStorage.setItem('fantasyConfig', JSON.stringify(config));
    }

    loadSavedConfig() {
        const saved = localStorage.getItem('fantasyConfig');
        if (saved) {
            const config = JSON.parse(saved);
            document.getElementById('leagueId').value = config.leagueId || '';
            document.getElementById('seasonId').value = config.seasonId || '2024';
            document.getElementById('scoringPeriodId').value = config.scoringPeriodId || '';

            if (config.isPrivate) {
                document.getElementById('isPrivate').checked = true;
                document.getElementById('privateCookies').style.display = 'block';
            }
        }
    }
}

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new FantasyDashboard();

    // Lazy load free agents and draft when tabs are clicked
    document.querySelector('[data-tab="freeAgents"]').addEventListener('click', () => {
        if (window.dashboard.currentLeagueId) {
            window.dashboard.loadFreeAgents();
        }
    });

    document.querySelector('[data-tab="draft"]').addEventListener('click', () => {
        if (window.dashboard.currentLeagueId) {
            window.dashboard.loadDraft();
        }
    });
});
