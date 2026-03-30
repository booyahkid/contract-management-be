const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller");

router.get("/summary/total-this-year", dashboardController.totalThisYear);
router.get("/summary/active", dashboardController.activeContracts);
router.get("/summary/due-soon", dashboardController.dueSoonContracts);
router.get("/summary/expired", dashboardController.expiredContracts);
router.get("/summary/status-by-year", dashboardController.statusByYear);
router.get("/due-soon", dashboardController.dueSoonContractList);
router.get("/group-by-department", dashboardController.groupByDepartment);
router.get("/notifications/due-soon", dashboardController.dueSoonContractList);
router.get("/group-by-duration", dashboardController.groupByDuration);
router.get("/due-by-month", dashboardController.dueByMonth);
router.get("/group-by-category", dashboardController.groupByCategory);
router.get("/created-by-month", dashboardController.createdByMonth);

module.exports = router;