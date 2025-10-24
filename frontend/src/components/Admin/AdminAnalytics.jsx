import React from "react";
import SystemUserAnalytics from "./SystemUserAnalytics";

function AdminAnalytics() {
	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
			{/* Analytics Cards Staggered Vertically */}
			<section>
				<SystemUserAnalytics />
			</section>
		</div>
	);
}

export default AdminAnalytics;