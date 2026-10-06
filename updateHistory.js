const fs = require('fs');
let html = fs.readFileSync('D:/BackendCodersWork/SMS/SmsAngular/sms-ui/src/app/features/university/university-student-detail/university-student-detail.html', 'utf8');

const oldContent = /<div \*ngIf="!studentHistory \|\| studentHistory\.length === 0" class="student-history-empty"[\s\S]*?<\/div>\s*<\/div>/;

const newContent = 
            <!--
              OLD STUDENT HISTORY DESIGN
              Kept for reference/rollback.
              DO NOT DELETE.
            -->
            <!--
            <div *ngIf="!studentHistory || studentHistory.length === 0" class="student-history-empty" style="padding: 16px; text-align: center; color: var(--da-muted);">
                No activity has been recorded for this student yet.
            </div>

            <div *ngIf="studentHistory && studentHistory.length > 0" class="student-history" style="position: relative; padding-left: 20px; margin-top: 16px;">
                <div class="student-history-line" style="position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--da-border);"></div>
                
                <div *ngFor="let item of studentHistory" class="student-history-item" style="position: relative; margin-bottom: 20px;">
                    <div class="student-history-icon" style="position: absolute; left: -26px; top: 0; width: 14px; height: 14px; border-radius: 50%; background: white; border: 2px solid var(--da-primary);"></div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-left: 12px;">
                        <div>
                            <strong class="student-history-title" style="display: block; font-size: 15px; color: var(--da-text);">{{ item.title }}</strong>
                            <div *ngIf="item.description" class="student-history-description" style="color: var(--da-muted); font-size: 13.5px; margin-top: 4px;">{{ item.description }}</div>
                        </div>
                        <div class="student-history-time" style="text-align: right; color: var(--da-muted); font-size: 12.5px;">
                            <strong class="student-history-date" style="display: block;">{{ item.createdDate | date:'dd MMM yyyy' }}</strong>
                            <span>{{ item.createdDate | date:'hh:mm a' }}</span>
                        </div>
                    </div>
                </div>
            </div>
            -->

            <!-- NEW STUDENT HISTORY DESIGN -->
            <div *ngIf="!studentHistory || studentHistory.length === 0" class="student-history-empty" style="padding: 16px; text-align: center; color: var(--da-muted);">
                No activity has been recorded for this student yet.
            </div>

            <div *ngIf="studentHistory && studentHistory.length > 0" class="student-history" style="position: relative; padding-left: 32px; margin-top: 16px; padding-bottom: 8px;">
                <div class="student-history-line" style="position: absolute; left: 11px; top: 14px; bottom: 24px; width: 2px; background: var(--da-border, #e2e8f0);"></div>
                
                <div *ngFor="let item of studentHistory; let last = last" class="student-history-item" style="position: relative; margin-bottom: 24px;">
                    <div class="student-history-icon" style="position: absolute; left: -32px; top: 0px; width: 24px; height: 24px; border-radius: 50%; background: white; border: 2px solid var(--da-border, #e2e8f0); display: flex; align-items: center; justify-content: center;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--da-primary, #16a34a)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; width: 100%;">
                        <div style="flex: 1; min-width: 250px;">
                            <div class="student-history-title" style="font-size: 14.5px; font-weight: 600; color: var(--da-text, #1e293b); margin-bottom: 4px;">{{ item.title }}</div>
                            <div *ngIf="item.description" class="student-history-description" style="color: var(--da-muted, #64748b); font-size: 13.5px; line-height: 1.4;">{{ item.description }}</div>
                        </div>
                        <div class="student-history-time" style="text-align: right; color: var(--da-muted, #64748b); font-size: 13px; white-space: nowrap;">
                            <div class="student-history-date" style="color: var(--da-text, #1e293b); font-weight: 500;">{{ item.createdDate | date:'dd MMM yyyy' }}</div>
                            <div style="margin-top: 2px;">{{ item.createdDate | date:'hh:mm a' }}</div>
                        </div>
                    </div>
                </div>
            </div>
;

const res = html.replace(oldContent, newContent);
if (res !== html) {
    fs.writeFileSync('D:/BackendCodersWork/SMS/SmsAngular/sms-ui/src/app/features/university/university-student-detail/university-student-detail.html', res);
    console.log('Replaced successfully');
} else {
    console.log('Match not found');
}
